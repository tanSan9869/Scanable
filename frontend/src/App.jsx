import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import SkipLink from './components/SkipLink';

import PublicHero from './pages/PublicHero';
import Auth from './pages/Auth';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [screen, setScreen] = useState('landing');
  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState({
    scanDepth: 10,
    wcagLevel: 'AA',
    followSubdomains: false,
    aiExplanations: true,
    aiFixSuggestions: true,
    emailReport: false
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        console.log('Supabase User ID:', session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        console.log('Supabase User ID:', session.user.id);
      }
      if (session) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const toastStyle = {
    style: {
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(20px)',
      color: '#161b26',
      border: '1px solid rgba(15, 23, 42, 0.12)',
      borderRadius: '14px',
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      boxShadow: '0 8px 28px rgba(15, 23, 42, 0.16)',
    },
    success: { iconTheme: { primary: '#00c2ff', secondary: '#1f2937' } },
    error: { iconTheme: { primary: '#ff5a8a', secondary: '#1f2937' } },
  };

  // PUBLIC
  if (!session) {
    return (
      <div className="bg-bg min-h-screen text-text font-body overflow-x-hidden">
        <SkipLink />
        <Toaster position="top-right" toastOptions={toastStyle} />
        <div id="main-content">
          <AnimatePresence mode="wait">
            {!showAuth ? (
              <PublicHero key="hero" onGetStarted={() => setShowAuth(true)} />
            ) : (
              <Auth key="auth" onBack={() => setShowAuth(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // AUTHENTICATED
  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <SkipLink />
      <Toaster position="top-right" toastOptions={toastStyle} />

      {/* Subtle background grid */}
      <div className="fixed inset-0 geo-grid pointer-events-none" aria-hidden="true" />
      
      {/* Aurora ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04] pointer-events-none" aria-hidden="true">
        <div className="w-full h-full bg-gradient-to-b from-accent to-transparent rounded-full blur-[120px]" />
      </div>

      <Navbar
        user={session.user}
        currentScreen={screen}
        setScreen={setScreen}
      />

      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          key={screen}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative pt-20 pb-8 px-4 md:px-6 max-w-6xl mx-auto"
          role="main"
        >
          {screen === 'landing' && (
            <Landing
              onScan={(data) => { setReport(data); setScreen('dashboard'); }}
              settings={settings}
              userId={session.user?.id}
            />
          )}
          {screen === 'dashboard' && (
            <Dashboard report={report} settings={settings} onRescan={() => setScreen('landing')} />
          )}
          {screen === 'history' && (
            <History user={session.user} />
          )}
          {screen === 'settings' && (
            <Settings settings={settings} setSettings={setSettings} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}