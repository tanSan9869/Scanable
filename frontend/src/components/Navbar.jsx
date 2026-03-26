import React, { useState } from 'react';
import { LogOut, ScanEye, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { id: 'landing', label: 'Scan' },
  { id: 'dashboard', label: 'Results' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export default function Navbar({ user, setScreen, currentScreen }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 inset-x-0 h-14 glass-strong z-50 px-5 md:px-8 flex items-center justify-between"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Accent top border line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/20 to-transparent" aria-hidden="true" />

      {/* Logo */}
      <button
        type="button"
        className="flex items-center gap-2.5 group"
        onClick={() => { setScreen('landing'); setMobileOpen(false); }}
        aria-label="Go to home"
      >
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_-4px_rgba(0,194,255,0.55)] transition-all duration-300">
          <ScanEye size={15} className="text-bg" />
        </div>
        <span className="font-display text-xl tracking-tight">ScanAble</span>
      </button>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = currentScreen === link.id;
          return (
            <button
              type="button"
              key={link.id}
              onClick={() => setScreen(link.id)}
              className={`relative px-4 py-1.5 text-[13px] font-medium transition-colors rounded-lg ${
                isActive ? 'text-text' : 'text-text-muted hover:text-text'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-black/6 rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}

        <div className="h-4 w-px bg-black/12 mx-3" aria-hidden="true" />

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center text-[10px] font-bold text-accent uppercase ring-1 ring-black/12">
            {user.email?.[0]}
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors"
            aria-label="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="md:hidden p-1.5 text-text-muted hover:text-text transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-0 right-0 glass-strong border-b border-black/12 p-3 md:hidden"
          >
            {navLinks.map((link) => {
              const isActive = currentScreen === link.id;
              return (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => { setScreen(link.id); setMobileOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'text-accent bg-accent/6' : 'text-text-muted hover:text-text'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}