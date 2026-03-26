const { createClient } = require("@supabase/supabase-js");

let client;

function getStorageConfig() {
  return {
    mode: (process.env.SUPABASE_STORAGE_MODE || "auto").toLowerCase(),
    runsTable: process.env.SUPABASE_SCAN_RUNS_TABLE || "scan_runs",
    pagesTable: process.env.SUPABASE_SCAN_PAGES_TABLE || "scan_pages",
    issuesTable: process.env.SUPABASE_SCAN_ISSUES_TABLE || "scan_issues",
    legacyTable: process.env.SUPABASE_SCANS_TABLE || "scans",
    defaultUserId: process.env.SUPABASE_DEFAULT_USER_ID || null,
  };
}

function getSupabaseClient() {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  return client;
}

async function persistScanReport({ sourceUrl, summary, pages, meta, userId }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { stored: false, reason: "Supabase credentials not configured" };
  }

  const config = getStorageConfig();

  const normalizedEnabled = config.mode === "auto" || config.mode === "normalized";
  const legacyEnabled = config.mode === "auto" || config.mode === "legacy";

  let normalizedError = null;
  if (normalizedEnabled) {
    const normalizedResult = await persistNormalizedScan(supabase, config, { sourceUrl, summary, pages, meta, userId });
    if (normalizedResult.stored) {
      return normalizedResult;
    }
    normalizedError = normalizedResult.reason;
    if (config.mode === "normalized") {
      return normalizedResult;
    }
  }

  if (legacyEnabled) {
    const legacyResult = await persistLegacyScan(supabase, config, { sourceUrl, summary, userId });
    if (legacyResult.stored) {
      return {
        ...legacyResult,
        fallbackFrom: normalizedError ? "normalized" : undefined,
      };
    }

    return {
      stored: false,
      table: config.legacyTable,
      reason: normalizedError
        ? `Normalized storage failed (${normalizedError}) and legacy fallback failed (${legacyResult.reason}).`
        : legacyResult.reason,
    };
  }

  return {
    stored: false,
    reason: "Supabase storage mode disabled.",
  };
}

async function fetchRecentScans(limit = 20, options = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { scans: [], storage: { enabled: false, reason: "Supabase credentials not configured" } };
  }

  const config = getStorageConfig();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const userId = typeof options.userId === "string" && options.userId.trim() ? options.userId.trim() : null;

  const normalizedEnabled = config.mode === "auto" || config.mode === "normalized";
  const legacyEnabled = config.mode === "auto" || config.mode === "legacy";

  if (config.mode === "auto" && normalizedEnabled && legacyEnabled) {
    const normalizedRead = await fetchNormalizedScans(supabase, config, safeLimit, userId);
    const legacyRead = await fetchLegacyScans(supabase, config, safeLimit, userId);

    if (normalizedRead.ok || legacyRead.ok) {
      const normalizedScans = normalizedRead.ok ? normalizedRead.value.scans || [] : [];
      const legacyScans = legacyRead.ok ? legacyRead.value.scans || [] : [];
      const mergedScans = dedupeScansByFingerprint([...normalizedScans, ...legacyScans])
        .sort((a, b) => new Date(b.scanned_at || b.created_at || 0).getTime() - new Date(a.scanned_at || a.created_at || 0).getTime())
        .slice(0, safeLimit);

      return {
        scans: mergedScans,
        storage: {
          enabled: true,
          mode: "auto",
          table: [config.runsTable, config.legacyTable].join(","),
          normalizedCount: normalizedScans.length,
          legacyCount: legacyScans.length,
          ...(normalizedRead.ok ? {} : { normalizedReason: normalizedRead.reason }),
          ...(legacyRead.ok ? {} : { legacyReason: legacyRead.reason }),
        },
      };
    }

    return {
      scans: [],
      storage: {
        enabled: false,
        mode: "auto",
        table: [config.runsTable, config.legacyTable].join(","),
        reason: `Normalized history failed (${normalizedRead.reason}) and legacy history failed (${legacyRead.reason}).`,
      },
    };
  }

  if (normalizedEnabled) {
    const normalizedRead = await fetchNormalizedScans(supabase, config, safeLimit, userId);
    if (normalizedRead.ok) {
      return normalizedRead.value;
    }

    if (config.mode === "normalized") {
      return {
        scans: [],
        storage: {
          enabled: false,
          table: config.runsTable,
          reason: normalizedRead.reason,
        },
      };
    }

    if (legacyEnabled) {
      const legacyRead = await fetchLegacyScans(supabase, config, safeLimit, userId);
      if (legacyRead.ok) {
        return {
          ...legacyRead.value,
          storage: {
            ...legacyRead.value.storage,
            fallbackFrom: "normalized",
          },
        };
      }

      return {
        scans: [],
        storage: {
          enabled: false,
          table: config.legacyTable,
          reason: `Normalized history failed (${normalizedRead.reason}) and legacy history failed (${legacyRead.reason}).`,
        },
      };
    }
  }

  if (legacyEnabled) {
    const legacyRead = await fetchLegacyScans(supabase, config, safeLimit, userId);
    if (legacyRead.ok) {
      return legacyRead.value;
    }

    return {
      scans: [],
      storage: {
        enabled: false,
        table: config.legacyTable,
        reason: legacyRead.reason,
      },
    };
  }

  return {
    scans: [],
    storage: {
      enabled: false,
      reason: "Supabase storage mode disabled.",
    },
  };
}

async function deleteScanById(scanId, options = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { deleted: false, reason: "Supabase credentials not configured" };
  }

  const config = getStorageConfig();
  const userId = typeof options.userId === "string" && options.userId.trim() ? options.userId.trim() : null;
  const normalizedEnabled = config.mode === "auto" || config.mode === "normalized";
  const legacyEnabled = config.mode === "auto" || config.mode === "legacy";

  if (normalizedEnabled) {
    let normalizedDeleteQuery = supabase.from(config.runsTable).delete().eq("id", scanId);
    if (userId) {
      normalizedDeleteQuery = normalizedDeleteQuery.filter("meta->>userId", "eq", userId);
    }
    const normalizedDelete = await normalizedDeleteQuery;
    if (!normalizedDelete.error) {
      return { deleted: true, table: config.runsTable, mode: "normalized" };
    }

    if (config.mode === "normalized") {
      return {
        deleted: false,
        table: config.runsTable,
        reason: formatSupabaseError(normalizedDelete.error, config.runsTable),
      };
    }
  }

  if (legacyEnabled) {
    let legacyDeleteQuery = supabase.from(config.legacyTable).delete().eq("id", scanId);
    if (userId) {
      legacyDeleteQuery = legacyDeleteQuery.eq("user_id", userId);
    }
    const legacyDelete = await legacyDeleteQuery;
    if (!legacyDelete.error) {
      return { deleted: true, table: config.legacyTable, mode: "legacy" };
    }

    return {
      deleted: false,
      table: config.legacyTable,
      reason: formatSupabaseError(legacyDelete.error, config.legacyTable),
    };
  }

  return {
    deleted: false,
    reason: "Supabase storage mode disabled.",
  };
}

async function persistNormalizedScan(supabase, config, { sourceUrl, summary, pages, meta, userId }) {
  const normalizedMeta = {
    ...(meta || {}),
    ...(userId ? { userId } : {}),
  };

  const runPayload = {
    source_url: sourceUrl,
    pages_scanned: summary.pagesScanned,
    total_issues: summary.totalIssues,
    score: summary.score,
    summary,
    meta: normalizedMeta,
    request_id: meta?.requestId || null,
    status: "completed",
    duration_ms: meta?.durationMs || null,
    timings: meta?.timings || null,
    scanned_at: new Date().toISOString(),
  };

  const runInsert = await supabase.from(config.runsTable).insert(runPayload).select("id").single();
  if (runInsert.error || !runInsert.data?.id) {
    return {
      stored: false,
      table: config.runsTable,
      reason: formatSupabaseError(runInsert.error, config.runsTable),
    };
  }

  const runId = runInsert.data.id;

  for (const page of pages || []) {
    const pageInsert = await supabase
      .from(config.pagesTable)
      .insert({
        run_id: runId,
        page_url: page.url,
        issues_count: Array.isArray(page.issues) ? page.issues.length : 0,
      })
      .select("id")
      .single();

    const pageId = pageInsert.data?.id || null;

    const issues = Array.isArray(page.issues) ? page.issues : [];
    if (issues.length === 0) continue;

    const issueRows = issues.map((issue) => ({
      run_id: runId,
      page_id: pageId,
      page_url: page.url,
      issue: issue.issue,
      severity: issue.severity,
      html: issue.html || null,
      target: issue.target || null,
      description: issue.description || null,
      explanation: issue.explanation || null,
      impact: issue.impact || null,
      fix: issue.fix || null,
      raw: issue,
    }));

    const issuesInsert = await supabase.from(config.issuesTable).insert(issueRows);
    if (issuesInsert.error) {
      return {
        stored: false,
        table: config.issuesTable,
        reason: formatSupabaseError(issuesInsert.error, config.issuesTable),
      };
    }
  }

  return {
    stored: true,
    table: config.runsTable,
    mode: "normalized",
  };
}

async function persistLegacyScan(supabase, config, { sourceUrl, summary, userId }) {
  const legacyPayload = {
    url: sourceUrl,
    overall_score: summary.score,
    screenshot: null,
    ...((userId || config.defaultUserId) ? { user_id: userId || config.defaultUserId } : {}),
  };

  const result = await supabase.from(config.legacyTable).insert(legacyPayload);
  if (!result.error) {
    return {
      stored: true,
      table: config.legacyTable,
      mode: "legacy",
    };
  }

  return {
    stored: false,
    table: config.legacyTable,
    reason: formatSupabaseError(result.error, config.legacyTable),
  };
}

async function fetchNormalizedScans(supabase, config, limit, userId = null) {
  let query = supabase
    .from(config.runsTable)
    .select("id,source_url,pages_scanned,total_issues,score,summary,meta,request_id,status,duration_ms,timings,scanned_at,created_at");

  if (userId) {
    query = query.filter("meta->>userId", "eq", userId);
  }

  const result = await query.order("scanned_at", { ascending: false }).limit(limit);

  if (result.error) {
    return {
      ok: false,
      reason: formatSupabaseError(result.error, config.runsTable),
    };
  }

  return {
    ok: true,
    value: {
      scans: result.data || [],
      storage: { enabled: true, table: config.runsTable, mode: "normalized" },
    },
  };
}

async function fetchLegacyScans(supabase, config, limit, userId = null) {
  let data;
  let error;

  const applyUserScope = (query) => (userId ? query.eq("user_id", userId) : query);

  ({ data, error } = await applyUserScope(
    supabase
      .from(config.legacyTable)
      .select("*")
      .order("scanned_at", { ascending: false })
      .limit(limit)
  ));

  if (error && String(error.message || "").toLowerCase().includes("column") && String(error.message || "").toLowerCase().includes("scanned_at")) {
    ({ data, error } = await applyUserScope(
      supabase
        .from(config.legacyTable)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
    ));
  }

  if (error && String(error.message || "").toLowerCase().includes("column") && String(error.message || "").toLowerCase().includes("created_at")) {
    ({ data, error } = await applyUserScope(supabase.from(config.legacyTable).select("*").limit(limit)));
  }

  if (error) {
    return {
      ok: false,
      reason: formatSupabaseError(error, config.legacyTable),
    };
  }

  return {
    ok: true,
    value: {
      scans: (data || []).map((row) => ({
        ...row,
        source_url: row.source_url || row.url || null,
        score: row.score ?? row.overall_score ?? null,
        pages_scanned: row.pages_scanned ?? row.summary?.pagesScanned ?? null,
        total_issues: row.total_issues ?? row.summary?.totalIssues ?? null,
        scanned_at: row.scanned_at || row.created_at || null,
      })),
      storage: { enabled: true, table: config.legacyTable, mode: "legacy" },
    },
  };
}

function formatSupabaseError(error, table) {
  const message = String(error?.message || "Unknown storage error");
  const lower = message.toLowerCase();

  if (lower.includes("row-level security")) {
    return `Supabase insert blocked by RLS on ${table}. Use SUPABASE_SERVICE_ROLE_KEY in backend/.env or create INSERT/SELECT policies.`;
  }

  if (lower.includes("null value") && lower.includes("user_id")) {
    return "Supabase insert failed: user_id is required. Set SUPABASE_DEFAULT_USER_ID in backend/.env.";
  }

  if (lower.includes("schema cache") || lower.includes("does not exist")) {
    return `Table/schema mismatch for ${table}. Run backend/sql/supabase_scan_reports.sql in Supabase SQL Editor.`;
  }

  return `Supabase operation failed: ${message}`;
}

function dedupeScansByFingerprint(scans) {
  const seen = new Set();
  const deduped = [];

  for (const scan of scans || []) {
    const url = String(scan?.source_url || scan?.url || "").trim().toLowerCase();
    const score = Number(scan?.score ?? scan?.overall_score ?? 0);
    const totalIssues = Number(scan?.total_issues ?? scan?.summary?.totalIssues ?? 0);
    const timestampRaw = scan?.scanned_at || scan?.created_at || null;
    const timestamp = timestampRaw ? new Date(timestampRaw).toISOString().slice(0, 16) : "";
    const user = String(scan?.meta?.userId || scan?.user_id || "").trim();
    const fingerprint = `${url}__${score}__${totalIssues}__${timestamp}__${user}`;

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      deduped.push(scan);
    }
  }

  return deduped;
}

module.exports = {
  persistScanReport,
  fetchRecentScans,
  deleteScanById,
};
