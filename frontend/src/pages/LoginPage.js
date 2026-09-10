import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Add pulse effect visually
    const btn = document.getElementById('login-btn');
    if (btn) btn.classList.add('pulse-effect');

    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.data?.detail || 'Invalid credentials. Please try again.');
      if (btn) btn.classList.remove('pulse-effect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md px-hud-inset sm:px-0 mx-auto mt-20">
      <div className="glass-panel rounded-xl p-8 sm:p-10 flex flex-col gap-8 relative overflow-hidden animate-in">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-monarch-crimson to-transparent opacity-70"></div>
        
        {/* Header Section */}
        <header className="text-center flex flex-col gap-2 relative">
          <div className="absolute -top-4 left-0 w-2 h-2 bg-monarch-crimson shadow-[0_0_8px_#e11d48] animate-pulse"></div>
          <h1 className="font-monarch-display text-headline-status-mobile md:text-headline-status text-monarch-crimson tracking-tighter uppercase crimson-text-glow flicker">
            Monarch System
          </h1>
          <p className="font-label-system text-label-system text-on-surface-variant uppercase opacity-80 tracking-[0.2em]">
            Enter the Shadow Realm
          </p>
        </header>

        {error && (
          <div className="bg-error-container/20 border border-error/50 text-error p-3 rounded text-sm text-center">
            {error}
          </div>
        )}

        {/* Demo Account Quick Fill Button */}
        <div className="bg-surface-container-lowest/40 border border-primary/20 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-label-system">
            <span className="text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              TEST HUNTER ACCOUNT
            </span>
            <span className="text-on-surface-variant/60 font-mono text-[10px]">C-RANK // LVL 5</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ username: 'hunter@ascend.com', password: 'Password123!' });
              setError('');
            }}
            className="w-full py-2 px-3 rounded bg-monarch-crimson/15 hover:bg-monarch-crimson/25 border border-monarch-crimson/40 text-monarch-crimson transition-all font-label-system text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            Auto-Fill Credentials (hunter@ascend.com)
          </button>
        </div>

        {/* Form Section */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* ID/Username/Email Input */}
          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between" htmlFor="hunter-id">
              <span>Email or Hunter Name</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">badge</span>
              <input 
                id="hunter-id" 
                type="text" 
                required 
                autoComplete="username" 
                placeholder="hunter@ascend.com or hunter" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-4 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between" htmlFor="auth-key">
              <span>Authorization Key</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">key</span>
              <input 
                id="auth-key" 
                type={showPassword ? "text" : "password"} 
                required 
                autoComplete="current-password" 
                placeholder="••••••••••••" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-10 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-monarch-crimson transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button 
              id="login-btn" 
              type="submit" 
              disabled={loading}
              className="monarch-btn w-full rounded py-4 font-label-system text-label-system uppercase tracking-widest flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Authenticating...' : 'Initialize System'}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
            </button>
          </div>
        </form>

        {/* Secondary Actions */}
        <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 pt-6 border-t border-monarch-crimson/20">
          <button className="font-label-system text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">lock_reset</span>
            Recover Access
          </button>
          <Link to="/register" className="font-label-system text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">person_add</span>
            New Hunter Registration
          </Link>
        </footer>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-monarch-crimson/50 to-transparent"></div>
      </div>

      {/* System Status Indicator */}
      <div className="fixed bottom-margin-safe right-margin-safe hidden sm:flex items-center gap-2 text-[10px] font-label-system text-monarch-crimson/60 uppercase">
        <div className="w-1.5 h-1.5 rounded-full bg-monarch-crimson animate-pulse"></div>
        SYS.ONLINE // V.1.0.4
      </div>
    </div>
  );
}
