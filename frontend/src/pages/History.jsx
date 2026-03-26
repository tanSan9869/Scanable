import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  ExternalLink,
  Trash2,
  Search,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function History({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    if (deleteConfirm !== null && modalRef.current) modalRef.current.focus();
  }, [deleteConfirm]);

  async function fetchHistory() {
    try {
      const userId = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`${API_BASE}/scan/history${userId}`);
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to load history');
      }
      setScans(Array.isArray(payload?.scans) ? payload.scans : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load history');
      setScans([]);
    } finally {
      setLoading(false);
    }
  }

  const deleteScan = useCallback(async (id) => {
    try {
      const userId = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`${API_BASE}/scan/history/${encodeURIComponent(id)}${userId}`, {
        method: 'DELETE',
      });
      const payload = await res.json();
      if (!res.ok || !payload?.deleted) {
        throw new Error(payload?.error || 'Delete failed');
      }
      setScans(prev => prev.filter(s => s.id !== id));
      toast.success('Record deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete scan');
    }
    setDeleteConfirm(null);
  }, [user?.id]);

  const filteredScans = scans
    .filter(s => {
      if (!searchQuery) return true;
      try { return new URL(s.url).hostname.includes(searchQuery.toLowerCase()); }
      catch { return s.url.toLowerCase().includes(searchQuery.toLowerCase()); }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score_asc': return (a.score || 0) - (b.score || 0);
        case 'score_desc': return (b.score || 0) - (a.score || 0);
        case 'date_asc': return new Date(a.created_at) - new Date(b.created_at);
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const getTrend = (scan, idx) => {
    try {
      const host = new URL(scan.url).hostname;
      const older = scans.find((s, i) => {
        if (i <= idx) return false;
        try { return new URL(s.url).hostname === host; } catch { return false; }
      });
      if (!older) return null;
      const diff = scan.score - older.score;
      return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same', diff: Math.abs(diff) };
    } catch { return null; }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00c2ff';
    if (score >= 50) return '#ffb347';
    return '#ff5a8a';
  };

  return (
    <div className="pb-8" role="region" aria-label="Audit History">
      <header className="mb-8">
        <p className="text-text-muted text-base font-medium uppercase tracking-[0.14em] mb-2">Past Scans</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-[-0.02em]">History</h1>
      </header>

      {/* Search & Sort */}
      {!loading && scans.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter by domain..."
              className="w-full bg-black/3 border border-black/8 rounded-xl py-2.5 pl-10 pr-8 text-base outline-none placeholder:text-text-subtle focus:border-accent/20 focus:bg-black/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search scans by domain"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/3 border border-black/8 rounded-xl py-2.5 px-4 text-base text-text-muted outline-none cursor-pointer hover:border-black/20 transition-all"
            aria-label="Sort scans"
          >
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="score_desc">Best Score</option>
            <option value="score_asc">Worst Score</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-lg text-text-muted" role="status">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          Loading...
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="glass rounded-2xl py-12 text-center">
          <HistoryIcon size={36} className="mx-auto text-text-subtle mb-3" aria-hidden="true" />
          <p className="text-text-muted text-lg">
            {searchQuery ? `No results for "${searchQuery}"` : 'No scans yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-1" role="list">
          {filteredScans.map((scan, i) => {
            const trend = getTrend(scan, i);
            const scoreColor = getScoreColor(scan.score);
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                key={scan.id}
                className="group glass hover:border-black/20 rounded-xl p-3 md:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all gap-2 card-shine"
                role="listitem"
              >
                <div className="flex items-center gap-4">
                  {/* Score circle with glow */}
                  <div
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-display text-2xl shrink-0"
                    style={{
                      borderColor: scoreColor,
                      color: scoreColor,
                      boxShadow: `0 0 16px ${scoreColor}20`,
                    }}
                  >
                    {scan.score}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-semibold">
                        {(() => { try { return new URL(scan.url).hostname; } catch { return scan.url; } })()}
                      </h3>
                      {trend && trend.dir !== 'same' && (
                        <span className={`inline-flex items-center gap-0.5 text-base font-mono font-medium px-1.5 py-0.5 rounded-md ${
                          trend.dir === 'up' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'
                        }`}>
                          {trend.dir === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {trend.diff}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-lg text-text-muted">
                      <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                      <span className="w-0.5 h-0.5 bg-black/20 rounded-full" aria-hidden="true" />
                      <span>{scan.total_issues} issues</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => window.open(scan.url, '_blank')}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/4 transition-all"
                    aria-label="Open website"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(scan.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                    aria-label="Delete scan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {!loading && scans.length > 0 && (
        <p className="mt-3 text-center text-lg text-text-subtle" aria-live="polite">
          {filteredScans.length} of {scans.length} scans
        </p>
      )}

      {/* Delete dialog */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
          >
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="relative glass-strong rounded-2xl p-5 max-w-sm w-full shadow-2xl outline-none"
              onKeyDown={(e) => e.key === 'Escape' && setDeleteConfirm(null)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-danger" />
                </div>
                <h3 className="font-body font-semibold text-lg">Delete this scan?</h3>
              </div>
              <p className="text-text-muted text-base mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-xl glass text-base font-medium hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteScan(deleteConfirm)}
                  className="flex-1 py-2 rounded-xl bg-danger text-white text-base font-body font-semibold hover:bg-red-500 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}