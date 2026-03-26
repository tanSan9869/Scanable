import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Cpu, Zap, ShieldCheck, Loader2, ArrowRight, Globe, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function Landing({ onScan, settings, userId }) {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const startScan = async () => {
    if (!url) return;
    setIsScanning(true);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + Math.random() * 12, 92));
    }, 500);

    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages: settings.scanDepth, userId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'Scan failed');
      }

      setScanProgress(100);
      setTimeout(() => onScan(data), 400);
    } catch (e) {
      console.error('Scan failed:', e);
      toast.error(e?.message || 'Scan failed');
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
    }
  };

  return (
    <div className="relative min-h-[82vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 geo-dots opacity-30" aria-hidden="true" />
      <div className="aurora-blob aurora-3" aria-hidden="true" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-14 relative z-10"
      >
        <h1 className="font-display text-5xl md:text-7xl tracking-[-0.02em] leading-[1.05] mb-5">
          Run an <span className="text-gradient italic">audit</span>
        </h1>
        <p className="text-text-muted text-base md:text-lg max-w-md mx-auto leading-relaxed font-light">
          Enter any URL to scan for WCAG 2.2 accessibility violations and get actionable fixes.
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="w-full max-w-2xl relative z-10 group"
      >
        {/* Focus glow */}
        <div className="absolute -inset-3 bg-accent/4 rounded-[28px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" aria-hidden="true" />

        <div className="relative glass rounded-2xl p-2 flex items-center gap-2 group-focus-within:border-accent/20 transition-colors shadow-2xl shadow-black/10 glow-border">
          <div className="pl-4 text-text" aria-hidden="true">
            <Globe size={18} />
          </div>
          <input
            type="url"
            placeholder="https://example.com"
            className="bg-transparent flex-1 px-2 py-3.5 outline-none text-sm text-text placeholder:text-text-muted placeholder:opacity-100 font-body"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startScan()}
            aria-label="Website URL to audit"
            disabled={isScanning}
          />
          <button
            type="button"
            onClick={startScan}
            disabled={isScanning || !url}
            className="bg-accent text-black px-7 py-3.5 rounded-xl font-body font-semibold text-sm hover:shadow-[0_0_50px_-10px_rgba(0,194,255,0.45)] active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-2 shimmer-btn"
            aria-label={isScanning ? 'Scanning in progress' : 'Start accessibility audit'}
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning
              </>
            ) : (
              <>
                Scan
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-2"
              role="status"
              aria-live="polite"
            >
              <div className="w-full h-1 bg-black/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ boxShadow: '0 0 20px rgba(0, 194, 255, 0.45)' }}
                />
              </div>
              <p className="text-center text-xs text-text-muted font-mono tabular-nums">
                Analyzing pages... {Math.round(scanProgress)}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global settings indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 flex items-center justify-center gap-6 text-xs font-mono text-text-muted tracking-widest uppercase pointer-events-none"
        >
          <div className="flex items-center gap-2"><Globe size={12} className="text-accent/65" /> Depth: {settings.scanDepth}</div>
          <div className="w-1 h-1 rounded-full bg-black/20" />
          <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent/65" /> Level: {settings.wcagLevel}</div>
          <div className="w-1 h-1 rounded-full bg-black/20" />
          <div className="flex items-center gap-2"><Sparkles size={12} className="text-accent/65" /> AI: {settings.aiFixSuggestions ? 'Active' : 'Off'}</div>
        </motion.div>
      </motion.div>

      {/* Feature bento cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full max-w-3xl relative z-10"
      >
        {[
          { icon: Cpu, title: 'AI Remediation', desc: 'Intelligent fix suggestions for every violation found.' },
          { icon: Zap, title: 'Live DOM Scanning', desc: 'Crawl multiple pages and test the rendered DOM.' },
          { icon: ShieldCheck, title: 'WCAG 2.2 Coverage', desc: 'Full A, AA, and AAA success criteria coverage.' },
        ].map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="glass rounded-2xl p-6 hover:border-accent/10 transition-all group cursor-default card-shine relative noise"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/6 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <card.icon size={18} className="text-accent group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-body font-semibold text-sm mb-1.5">{card.title}</h3>
            <p className="text-text-muted text-[13px] leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}