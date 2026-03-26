import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ScanEye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');

  const handleAuth = async () => {
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      toast.error(authError.message);
    } else {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    handleAuth();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background mesh */}
      <div className="aurora-blob aurora-1" aria-hidden="true" />
      <div className="aurora-blob aurora-2" aria-hidden="true" />
      <div className="absolute inset-0 geo-grid" aria-hidden="true" />

      {/* Back */}
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-text-muted text-sm hover:text-text transition-colors group z-20"
        aria-label="Return to home"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </motion.button>

      {/* Card */}
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
        aria-label="Sign in to ScanAble"
        onSubmit={onSubmit}
      >
        {/* Glass card wrapper */}
        <div className="glass-strong rounded-3xl p-8 md:p-10 relative noise">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
              <ScanEye size={22} className="text-accent" />
            </div>
            <h2 className="font-display text-4xl mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-text-muted text-sm">
              {mode === 'login' ? 'Sign in to your workspace' : 'Start auditing for free'}
            </p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black/3 border border-black/8 text-sm font-medium hover:bg-black/5 hover:border-black/16 transition-all active:scale-[0.98]"
              aria-label="Continue with GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black/3 border border-black/8 text-sm font-medium hover:bg-black/5 hover:border-black/16 transition-all active:scale-[0.98]"
              aria-label="Continue with Google"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-black/12 flex-1" />
            <span className="text-text-subtle text-xs uppercase tracking-wider font-medium">or</span>
            <div className="h-px bg-black/12 flex-1" />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Fields */}
          <div className="space-y-3 mb-6">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-text-muted mb-1.5 ml-1 uppercase tracking-wider">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-black/3 border border-black/8 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-text-subtle focus:border-accent/30 focus:bg-black/5 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-text-muted mb-1.5 ml-1 uppercase tracking-wider">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className="w-full bg-black/3 border border-black/8 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-text-subtle focus:border-accent/30 focus:bg-black/5 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-accent text-black font-body font-semibold text-sm hover:shadow-[0_0_50px_-8px_rgba(0,194,255,0.45)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shimmer-btn"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-text-muted mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-accent hover:underline font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.form>
    </div>
  );
}