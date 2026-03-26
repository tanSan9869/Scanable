const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const crawlAndScan = require("./crawler");
const { persistScanReport, fetchRecentScans, deleteScanById } = require("./storage");

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
].filter(Boolean);

function normalizeSeverity(value) {
  return ["critical", "serious", "moderate", "minor"].includes(value) ? value : "minor";
}

function toPlainText(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildCorrectedCodeSnippet(violation, node) {
  const issueId = String(violation?.id || "").toLowerCase();
  const html = String(node?.html || "").trim();

  if (issueId === "landmark-one-main") {
    return [
      "<header>...</header>",
      "<main>",
      "  <!-- Primary page content -->",
      "  <h1>Page title</h1>",
      "  <p>Important content goes here.</p>",
      "</main>",
      "<footer>...</footer>",
    ].join("\n");
  }

  if (issueId === "html-has-lang") {
    return '<html lang="en">';
  }

  if (issueId === "image-alt") {
    return '<img src="example.jpg" alt="Descriptive image text" />';
  }

  if (issueId === "button-name") {
    return '<button type="button" aria-label="Open menu">☰</button>';
  }

  if (issueId === "link-name") {
    return '<a href="/about" aria-label="Read about our company">About us</a>';
  }

  if (issueId === "label") {
    return [
      '<label for="email">Email</label>',
      '<input id="email" name="email" type="email" />',
    ].join("\n");
  }

  if (issueId === "document-title") {
    return "<title>Accessible, descriptive page title</title>";
  }

  if (html) {
    return [
      "<!-- Corrected example (update attributes/structure for accessibility) -->",
      html,
    ].join("\n");
  }

  return "<!-- Add semantic markup and ARIA labels relevant to this issue -->";
}

function buildReportShape(result) {
  const explanationMap = new Map((result?.agents?.understandable || []).map((item) => [item.id, toPlainText(item.explanation)]));
  const perceivable = Array.isArray(result?.agents?.perceivable) ? result.agents.perceivable : [];

  const issues = perceivable.flatMap((violation) => {
    const nodes = Array.isArray(violation.nodes) && violation.nodes.length ? violation.nodes : [null];

    return nodes.map((node) => {
      const correctedCode = buildCorrectedCodeSnippet(violation, node);

      return {
        issue: violation.id || "unknown-issue",
        severity: normalizeSeverity(violation.impact),
        html: node?.html || "",
        target: Array.isArray(node?.target) ? node.target.join(" > ") : "",
        screenshot: node?.issueScreenshot || "",
        description: violation.description || violation.help || "",
        explanation: explanationMap.get(violation.id) || toPlainText(violation.help || ""),
        impact: violation.help || "",
        correctedCode,
        fixReference: violation.helpUrl || "",
        fix: correctedCode,
      };
    });
  });

  const pages = [
    {
      url: result.url,
      issues,
    },
  ];

  const summary = {
    pagesScanned: 1,
    totalIssues: Number(result.totalIssues || issues.length || 0),
    score: Number(result.score || 0),
  };

  return { summary, pages };
}

function mapHistoryRowsToFrontend(scans) {
  return (scans || []).map((scan) => ({
    ...scan,
    url: scan.url || scan.source_url || "",
    score: scan.score ?? scan.overall_score ?? 0,
    total_issues: scan.total_issues ?? scan.summary?.totalIssues ?? 0,
    created_at: scan.created_at || scan.scanned_at || new Date().toISOString(),
  }));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use("/screenshots", express.static("screenshots"));
app.use("/reports", express.static("reports"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", requestId: req.requestId });
});

app.post("/scan", async (req, res) => {
  try {
    const { url, userId } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    const startedAt = Date.now();
    const result = await crawlAndScan(url);
    const { summary, pages } = buildReportShape(result);

    const meta = {
      requestId: req.requestId,
      durationMs: Date.now() - startedAt,
      timings: {},
    };

    let storage = { stored: false, reason: "Storage unavailable" };
    try {
      storage = await persistScanReport({
        sourceUrl: result.url,
        summary,
        pages,
        meta,
        userId,
      });
    } catch (storageError) {
      storage = { stored: false, reason: storageError.message };
    }

    res.json({
      ...result,
      summary,
      pages,
      meta,
      storage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Scan failed", requestId: req.requestId });
  }
});

app.get("/scan/history", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const result = await fetchRecentScans(limit, { userId });
    res.json({
      scans: mapHistoryRowsToFrontend(result.scans),
      storage: result.storage,
      requestId: req.requestId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load history", requestId: req.requestId });
  }
});

app.delete("/scan/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

    if (!id) {
      return res.status(400).json({ error: "scan id is required", requestId: req.requestId });
    }

    const result = await deleteScanById(id, { userId });
    if (!result.deleted) {
      return res.status(400).json({ error: result.reason || "Failed to delete scan", requestId: req.requestId });
    }

    res.json({ deleted: true, storage: result, requestId: req.requestId });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete scan", requestId: req.requestId });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});
