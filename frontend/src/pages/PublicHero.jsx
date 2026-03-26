import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ScanEye, Shield, Zap, Layout, FileText, BarChart3, Fingerprint, AlertTriangle } from 'lucide-react';

export default function PublicHero({ onGetStarted }) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
  };

  const mockupItem = {
    hidden: { opacity: 0, scale: 0.9, rotateX: 0, rotateY: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 12,
      rotateY: -8,
      transition: { duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" role="banner">
      {/* Aurora mesh background */}
      <div className="aurora-blob aurora-1" aria-hidden="true" />
      <div className="aurora-blob aurora-2" aria-hidden="true" />
      <div className="aurora-blob aurora-3" aria-hidden="true" />
      <div className="aurora-blob aurora-4" aria-hidden="true" />

      {/* Dot grid */}
      <div className="absolute inset-0 geo-dots" aria-hidden="true" />

      {/* Vertical Scanning Ray */}
      <div 
        className="absolute inset-x-0 h-[300px] bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none z-0"
        style={{ animation: 'scanning-ray 12s linear infinite' }} 
        aria-hidden="true"
      />

      {/* Decorative Nodes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[
          { top: '15%', left: '10%', label: 'alt=""', delay: '0s' },
          { top: '65%', left: '85%', label: 'aria-label', delay: '2s' },
          { top: '25%', left: '80%', label: 'role="main"', delay: '4s' },
          { top: '75%', left: '15%', label: 'lang="en"', delay: '1s' },
          { top: '45%', left: '5%', label: 'WCAG 2.2', delay: '3s' },
          { top: '10%', left: '90%', label: 'AA', delay: '5s' },
        ].map((node, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
            className="absolute flex items-center gap-2"
            style={{ top: node.top, left: node.left }}
          >
            <div className="w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_#00c2ff]" />
            <div className="px-2 py-1 rounded bg-black/[0.03] border border-black/[0.08] text-xs font-mono text-text-subtle backdrop-blur-sm">
              {node.label}
            </div>
            {/* Pulsing ring */}
            <div 
              className="absolute -inset-2 border border-accent/20 rounded-full"
              style={{ animation: 'node-pulse 4s ease-out infinite', animationDelay: node.delay }}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto pt-20 md:pt-0">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 lg:gap-2 items-center"
        >
          {/* Left Side: Content */}
          <div className="text-left px-6 lg:px-12">
            {/* Badge */}
            <motion.div variants={item} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono font-medium tracking-wide text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                WCAG 2.2 Compliant Engine
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] mb-8"
            >
              Building the next
              <br />
              <span className="relative inline-block">
                <span className="text-gradient italic">standard</span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-[2px] bg-accent/30 origin-left rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.4, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden="true"
                />
              </span>
              <br />
              of accessibility.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={item}
              className="text-text-muted text-lg leading-relaxed max-w-lg mb-12 font-light"
            >
              Scan, detect, and fix accessibility debt instantly with the industry's most advanced audit engine. Inclusive by design.
            </motion.p>

            {/* CTA */}
            <motion.div variants={item} className="flex flex-wrap items-center gap-4 mb-16">
              <button
                type="button"
                onClick={onGetStarted}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-black font-body font-semibold text-[14px] rounded-2xl transition-all duration-500 active:scale-[0.97] shimmer-btn hover:shadow-[0_0_60px_-12px_rgba(0,194,255,0.45)]"
                aria-label="Get started with ScanAble"
              >
                Launch App
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button type="button" className="px-8 py-4 rounded-2xl glass text-[14px] font-semibold text-text-muted hover:text-text hover:bg-black/[0.04] transition-all">
                Read Documentation
              </button>
            </motion.div>

            {/* Trusted By (Logo Cloud) */}
            <motion.div variants={item} className="pt-8 border-t border-black/[0.08] hidden md:block">
              <p className="text-xs text-text-subtle font-mono uppercase tracking-[0.2em] mb-6">Standardized by world-class teams</p>
              <div className="flex items-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-2 font-display text-lg tracking-tighter"><Fingerprint size={20}/> LOGOS</div>
                <div className="flex items-center gap-2 font-display text-lg tracking-tighter"><Shield size={20}/> KRYPT</div>
                <div className="flex items-center gap-2 font-display text-lg tracking-tighter"><Zap size={20}/> FLASH</div>
                <div className="flex items-center gap-2 font-display text-lg tracking-tighter"><Layout size={20}/> GRID</div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Product Mockup */}
          <div className="relative perspective-hero px-6 lg:px-0 mt-12 lg:mt-0">
            <motion.div
              variants={mockupItem}
              className="mockup-tilt glass-strong rounded-3xl p-1 overflow-hidden relative noise group"
            >
              <div className="mockup-shine-overlay" />
              
              {/* Fake App Browser Window */}
              <div className="bg-bg/70 rounded-[22px] overflow-hidden border border-black/[0.08]">
                {/* Window Header */}
                <div className="h-10 bg-black/[0.03] border-b border-black/[0.08] flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <div className="flex-1 mx-4 h-5 rounded-md bg-black/[0.04] flex items-center justify-center">
                    <span className="text-xs text-text-subtle font-mono">audit.accesslens.com/scan/0x4F2...</span>
                  </div>
                </div>
                
                {/* Window Content */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                       <div className="w-24 h-2 bg-accent/20 rounded" />
                        <div className="w-48 h-5 bg-black/[0.12] rounded-lg" />
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-accent shadow-[0_0_20px_rgba(0,194,255,0.35)] flex items-center justify-center font-display text-xl text-accent">96</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 glass rounded-xl flex flex-col justify-center px-4">
                       <div className="text-xs text-text-muted mb-1">Critical</div>
                       <div className="text-xl font-display">02</div>
                    </div>
                    <div className="h-20 glass rounded-xl flex flex-col justify-center px-4">
                       <div className="text-xs text-text-muted mb-1">Warnings</div>
                       <div className="text-xl font-display">14</div>
                    </div>
                    <div className="h-20 glass rounded-xl flex flex-col justify-center px-4">
                       <div className="text-xs text-text-muted mb-1">Repaired</div>
                       <div className="text-xl font-display">68</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-12 glass rounded-xl px-4 flex items-center justify-between border-l-2 border-danger">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded bg-danger/10 flex items-center justify-center text-danger"><AlertTriangle size={12}/></div>
                         <div className="w-32 h-2 bg-black/[0.08] rounded" />
                       </div>
                       <div className="w-12 h-4 bg-accent/10 rounded-full" />
                    </div>
                    <div className="h-12 glass rounded-xl px-4 flex items-center justify-between border-l-2 border-warning">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded bg-warning/10 flex items-center justify-center text-warning"><Zap size={12}/></div>
                         <div className="w-40 h-2 bg-black/[0.08] rounded" />
                       </div>
                       <div className="w-12 h-4 bg-black/10 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements around mockup */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            </motion.div>
            
            {/* Floating indicator */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -left-10 glass-strong p-3 rounded-2xl shadow-2xl hidden lg:block z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black"><BarChart3 size={16}/></div>
                <div>
                  <div className="text-xs text-text-muted font-bold uppercase tracking-wider leading-none mb-1">Scan Quality</div>
                  <div className="text-xs font-semibold">Enterprise Grade</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg to-transparent pointer-events-none" aria-hidden="true" />
    </div>
  );
}