import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  RefreshCw,
  Code2,
  Zap,
  Search,
  Check,
  Download,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function Dashboard({ report, onRescan, settings }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const isActive = !!(report && report.summary);
  const displayData = isActive ? report : { summary: { score: 0, totalIssues: 0 }, pages: [] };

  const allIssues = useMemo(() => {
    if (!isActive) return [];
    return displayData.pages.flatMap(page =>
      page.issues.map(issue => ({ ...issue, pageUrl: page.url }))
    );
  }, [displayData, isActive]);

  const filteredIssues = allIssues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'critical') return ['critical', 'serious'].includes(issue.severity);
    return issue.severity === filter;
  });

  const groupedIssues = useMemo(() => {
    const groups = [
      {
        key: 'critical',
        label: 'Critical',
        color: '#ef4444',
        match: (severity) => ['critical', 'serious'].includes(severity),
      },
      {
        key: 'moderate',
        label: 'Moderate',
        color: '#ffb347',
        match: (severity) => severity === 'moderate',
      },
      {
        key: 'minor',
        label: 'Minor',
        color: '#00c2ff',
        match: (severity) => severity === 'minor',
      },
    ];

    return groups
      .map(group => ({
        ...group,
        issues: allIssues.filter(issue => group.match(issue.severity)),
      }))
      .filter(group => group.issues.length > 0);
  }, [allIssues]);

  const exportReport = useCallback(async () => {
    try {
      const reportPath = displayData?.report || report?.report || '';
      if (!reportPath) {
        toast.error('PDF report is not available for this scan');
        return;
      }

      const reportUrl = /^https?:\/\//i.test(reportPath)
        ? reportPath
        : `${API_BASE}${reportPath.startsWith('/') ? reportPath : `/${reportPath}`}`;

      const response = await fetch(reportUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF report');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `accessibility-report-${Date.now()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);

      setCopied(true);
      toast.success('PDF report downloaded');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(error?.message || 'Failed to export PDF');
    }
  }, [displayData, report]);

  const handleIssueKeyDown = useCallback((e, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      document.querySelector(`[data-issue="${index + 1}"]`)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      document.querySelector(`[data-issue="${index - 1}"]`)?.focus();
    }
  }, []);

  const severityCounts = useMemo(() => {
    const c = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    allIssues.forEach(i => { if (c[i.severity] !== undefined) c[i.severity]++; });
    return c;
  }, [allIssues]);

  const total = Math.max(allIssues.length, 1);

  const operableIssues = useMemo(() => {
    const raw = displayData?.agents?.operable;
    return Array.isArray(raw) ? raw : [];
  }, [displayData]);

  const robustMessages = useMemo(() => {
    const raw = displayData?.agents?.robust;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      return [{ type: 'error', message: raw }];
    }
    return [];
  }, [displayData]);

  const resolveMediaUrl = useCallback((raw) => {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${API_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }, []);

  const runStatus = useMemo(() => {
    const durationMs = Number(displayData?.meta?.durationMs || 0);
    const requestId = String(displayData?.meta?.requestId || '');
    const storage = displayData?.storage || null;

    return {
      durationLabel: durationMs > 0 ? `${(durationMs / 1000).toFixed(1)}s` : '—',
      requestIdLabel: requestId ? requestId.slice(0, 12) : '—',
      storedLabel: storage?.stored ? 'Stored' : 'Not stored',
      storedOk: !!storage?.stored,
      reason: storage?.stored ? '' : String(storage?.reason || '').trim(),
    };
  }, [displayData]);

  useEffect(() => {
    if (!enlargedImage) return;

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setEnlargedImage(null);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [enlargedImage]);

  return (
    <div className="pb-10" role="region" aria-label="Audit Results">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-2.5">
        <div>
          <p className="text-text-muted text-base font-medium uppercase tracking-[0.14em] mb-2">
            {isActive ? 'Audit Complete' : 'No Active Audit'}
          </p>
          <h1 className="font-display text-5xl md:text-7xl tracking-[-0.02em]">
            Results
            {isActive && (
              <span className="text-base font-mono text-accent ml-4 vertical-align-middle align-middle border border-accent/20 px-2 py-0.5 rounded bg-accent/5 uppercase">
                {settings.wcagLevel}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {isActive && (
            <button
              type="button"
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-base font-medium hover:border-black/20 transition-all"
              aria-label="Download PDF report"
            >
              {copied ? <Check size={14} className="text-accent" /> : <Download size={14} />}
              Export
            </button>
          )}
          <button
            type="button"
            onClick={onRescan}
            className="group flex items-center gap-2 px-5 py-2.5 bg-accent text-black rounded-xl text-base font-body font-semibold hover:shadow-[0_0_40px_-8px_rgba(0,194,255,0.45)] transition-all shimmer-btn"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            {isActive ? 'Rescan' : 'Start Scan'}
          </button>
        </div>
      </header>

      {isActive && (
        <section className="mb-5" aria-label="Run Status">
          <div className="glass rounded-2xl p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 text-base font-mono uppercase tracking-[0.1em] text-text-muted">
              <span>Duration: <span className="text-text">{runStatus.durationLabel}</span></span>
              <span className="w-1 h-1 rounded-full bg-black/20" aria-hidden="true" />
              <span>Request: <span className="text-text">{runStatus.requestIdLabel}</span></span>
              <span className="w-1 h-1 rounded-full bg-black/20" aria-hidden="true" />
              <span>
                Storage:{' '}
                <span className={runStatus.storedOk ? 'text-accent' : 'text-warning'}>
                  {runStatus.storedLabel}
                </span>
              </span>
            </div>
            {!runStatus.storedOk && runStatus.reason && (
              <p className="mt-2 text-base text-text-muted">{runStatus.reason}</p>
            )}
          </div>
        </section>
      )}

      {/* Metrics bento grid */}
      <div className="grid grid-cols-12 gap-3 mb-5">
        {/* Score Ring — large card */}
        <div className="col-span-12 lg:col-span-5 glass rounded-2xl px-8 py-3.5 flex flex-col items-center justify-center min-h-[205px] relative noise card-shine">
          <p className="text-base font-medium text-text-muted uppercase tracking-[0.14em] mb-3">Accessibility Score</p>
          {isActive ? (
            <ScoreRing score={displayData.summary.score} size={170} strokeWidth={9} />
          ) : (
            <div className="w-[170px] h-[170px] rounded-full border-[9px] border-black/8 flex items-center justify-center">
              <span className="font-display text-4xl text-text-subtle">—</span>
            </div>
          )}
        </div>

        {/* Severity tiles */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile label="Critical" value={severityCounts.critical + severityCounts.serious} color="#ef4444" active={isActive} />
          <MetricTile label="Moderate" value={severityCounts.moderate} color="#ffb347" active={isActive} />
          <MetricTile label="Minor" value={severityCounts.minor} color="#00c2ff" active={isActive} />
          <MetricTile label="Total" value={allIssues.length} color="#64748b" active={isActive} />
        </div>
      </div>

      {/* Severity bar */}
      {isActive && allIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          role="img"
          aria-label={`${severityCounts.critical + severityCounts.serious} critical, ${severityCounts.moderate} moderate, ${severityCounts.minor} minor issues`}
        >
          <div className="flex h-1.5 rounded-full overflow-hidden bg-black/8 gap-px">
            {[
              { key: 'critical', val: severityCounts.critical + severityCounts.serious, color: 'bg-danger', glow: '#ef4444' },
              { key: 'moderate', val: severityCounts.moderate, color: 'bg-warning', glow: '#ffb347' },
              { key: 'minor', val: severityCounts.minor, color: 'bg-accent', glow: '#00c2ff' },
            ].filter(s => s.val > 0).map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ width: 0 }}
                animate={{ width: `${(s.val / total) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`${s.color} ${i === 0 ? 'rounded-l-full' : ''}`}
                style={{
                  boxShadow: `0 0 12px ${s.glow}30`,
                  ...(s.key === 'critical' ? { backgroundColor: '#ef4444' } : {}),
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Additional backend checks */}
      {isActive && (
        <section className="mb-6" aria-label="Additional Checks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-4.5">
              <h3 className="font-display text-2xl mb-3">Operable Checks</h3>
              {operableIssues.length === 0 ? (
                <p className="text-base text-accent">No operable issues found.</p>
              ) : (
                <ul className="space-y-1">
                  {operableIssues.map((item, index) => (
                    <li key={`${item.issue}-${index}`} className="text-base text-text-muted leading-relaxed">
                      <span className="text-text font-medium capitalize">{item.severity || 'moderate'}:</span> {item.issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass rounded-2xl p-4.5">
              <h3 className="font-display text-2xl mb-3">Robust Validation</h3>
              {robustMessages.length === 0 ? (
                <p className="text-base text-accent">No robustness errors reported.</p>
              ) : (
                <ul className="space-y-1 max-h-64 overflow-auto pr-1">
                  {robustMessages.map((item, index) => (
                    <li key={`${item.type || 'msg'}-${index}`} className="text-base text-text-muted leading-relaxed">
                      <span className="text-text font-medium capitalize">{item.type || 'message'}:</span>{' '}
                      {item.message || item.excerpt || 'Validation message'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Issues */}
      <section aria-label="Violations">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <h2 className="font-display text-3xl">Violations</h2>
          {isActive && (
            <div className="flex gap-1.5" role="group" aria-label="Filter by severity">
              {['all', 'critical', 'moderate'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-4 py-1.5 rounded-lg text-base font-medium capitalize transition-all ${
                    filter === lvl
                      ? 'bg-accent text-black'
                      : 'glass text-text-muted hover:text-text'
                  }`}
                  aria-pressed={filter === lvl}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2" role="list">
          {isActive ? (
            filter === 'all' ? (
              groupedIssues.length > 0 ? (
                groupedIssues.map((group, groupIdx) => (
                  <div key={group.key} className="glass rounded-xl p-3 md:p-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="font-display text-2xl flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: group.color, boxShadow: `0 0 8px ${group.color}45` }}
                          aria-hidden="true"
                        />
                        {group.label}
                      </h3>
                      <span
                        className="text-base font-mono font-medium px-2 py-0.5 rounded-md"
                        style={{ color: group.color, backgroundColor: `${group.color}12` }}
                      >
                        {group.issues.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.issues.map((issue, i) => {
                        const idx = groupIdx * 1000 + i;
                        return (
                          <IssueCard
                            key={`${group.key}-${i}`}
                            index={idx}
                            issue={issue}
                            isOpen={expanded === idx}
                            onToggle={() => setExpanded(expanded === idx ? null : idx)}
                            onKeyDown={handleIssueKeyDown}
                            resolveMediaUrl={resolveMediaUrl}
                            onEnlargeImage={setEnlargedImage}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No issues found" />
              )
            ) : filteredIssues.length > 0 ? (
              filteredIssues.map((issue, i) => (
                <IssueCard
                  key={i}
                  index={i}
                  issue={issue}
                  isOpen={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                  onKeyDown={handleIssueKeyDown}
                  resolveMediaUrl={resolveMediaUrl}
                  onEnlargeImage={setEnlargedImage}
                />
              ))
            ) : (
              <EmptyState text="No issues match this filter" />
            )
          ) : (
            <EmptyState text="Run a scan to see results" action={onRescan} actionText="Start Scan" />
          )}
        </div>
      </section>

      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Issue screenshot preview"
          >
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              onClick={() => setEnlargedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="relative w-full max-w-5xl glass-strong rounded-2xl p-3"
            >
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg glass text-sm font-medium"
              >
                Close
              </button>
              <img
                src={enlargedImage}
                alt="Enlarged issue screenshot"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricTile({ label, value, color, active }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="glass rounded-2xl px-5 py-3.5 hover:border-black/20 transition-all card-shine relative noise"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: active ? color : 'rgba(15,23,42,0.12)',
            boxShadow: active ? `0 0 8px ${color}40` : 'none',
          }}
          aria-hidden="true"
        />
        <span className="text-base font-medium text-text-muted uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div
        className="font-display text-4xl leading-none"
        style={{ color: active ? color : 'rgba(15,23,42,0.25)' }}
      >
        {value.toString().padStart(2, '0')}
      </div>
    </motion.div>
  );
}

function EmptyState({ text, action, actionText }) {
  return (
    <div className="py-12 text-center glass rounded-2xl">
      <Search size={32} className="mx-auto text-text-subtle mb-4" aria-hidden="true" />
      <p className="text-text-muted text-lg mb-2.5">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action}
          className="text-accent text-base font-body font-semibold hover:underline inline-flex items-center gap-1"
        >
          {actionText} <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

function IssueCard({ issue, isOpen, onToggle, index, onKeyDown, resolveMediaUrl, onEnlargeImage }) {
  const colors = {
    critical: '#ef4444', serious: '#ef4444',
    moderate: '#ffb347', minor: '#00c2ff'
  };
  const issueImageUrl = resolveMediaUrl(issue?.screenshot);
  const correctedCode = String(issue?.correctedCode || issue?.fix || '').trim();
  const fixReference = String(issue?.fixReference || '').trim();

  return (
    <div
      className={`glass ${isOpen ? 'border-black/20' : ''} rounded-xl overflow-hidden transition-all card-shine`}
      role="listitem"
    >
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={(e) => onKeyDown(e, index)}
        data-issue={index}
        className="w-full flex items-center justify-between p-3 md:p-3.5 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-1 h-8 rounded-full shrink-0"
            style={{
              backgroundColor: colors[issue.severity] || 'rgba(15,23,42,0.12)',
              boxShadow: `0 0 8px ${colors[issue.severity]}20`,
            }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-lg font-semibold mb-0.5 group-hover:text-accent transition-colors capitalize">
              {issue.issue.replace(/-/g, ' ')}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base font-mono font-medium px-2 py-0.5 rounded-md capitalize"
                style={{
                  color: colors[issue.severity],
                  backgroundColor: `${colors[issue.severity]}12`,
                }}
              >
                {issue.severity}
              </span>
              <span className="text-lg text-text-subtle truncate max-w-[250px]">
                {(() => { try { return new URL(issue.pageUrl).pathname; } catch { return issue.pageUrl; } })()}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-text-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-3.5"
          >
            <div className="h-px bg-black/12 mb-3" />
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-base font-medium text-text-muted uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                  <Code2 size={12} aria-hidden="true" /> HTML Snapshot
                </p>
                <pre className="bg-bg/80 border border-black/12 p-2.5 rounded-xl text-base font-mono text-text-muted overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {issue.html || '// No HTML captured'}
                </pre>

                {issueImageUrl && (
                  <div className="mt-2.5">
                    <p className="text-base font-medium text-text-muted uppercase tracking-[0.1em] mb-2">Issue Screenshot</p>
                    <img
                      src={issueImageUrl}
                      alt={`${issue.issue} preview`}
                      className="w-full max-h-56 object-contain rounded-xl border border-black/[0.14] bg-bg/60"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => onEnlargeImage(issueImageUrl)}
                      className="mt-2.5 px-3 py-1.5 text-base rounded-lg glass hover:border-black/20 transition-all"
                    >
                      Enlarge
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-accent/3 border border-accent/6 p-4 rounded-xl relative">
                <p className="text-base font-medium text-accent uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                  <Zap size={12} aria-hidden="true" /> Suggested Fix
                </p>
                <p className="text-lg text-text-muted leading-relaxed mb-3">
                  {issue.explanation || 'No explanation available.'}
                </p>
                <p className="text-base font-medium text-accent uppercase tracking-[0.1em] mb-2">Corrected Code</p>
                <code className="block bg-bg/80 p-3 rounded-xl text-base font-mono text-accent/80 border border-accent/10 whitespace-pre-wrap">
                  {correctedCode || '<!-- Corrected code will appear here after scan mapping -->'}
                </code>
                {fixReference && (
                  <a
                    href={fixReference}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-block text-base text-accent hover:underline"
                  >
                    Reference guideline
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}