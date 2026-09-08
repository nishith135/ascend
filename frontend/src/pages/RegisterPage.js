import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    fitness_goal: 'strength',
    experience_level: 'beginner',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    const btn = document.getElementById('register-btn');
    if (btn) btn.classList.add('pulse-effect');

    try {
      await register(form);
      navigate('/');
    } catch (err) {
      if (err.data) {
        setErrors(err.data);
      } else {
        setErrors({ detail: 'Registration failed. Please try again.' });
      }
      if (btn) btn.classList.remove('pulse-effect');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative z-10 w-full max-w-md px-hud-inset sm:px-0 mx-auto mt-10 mb-10">
      <div className="glass-panel rounded-xl p-8 sm:p-10 flex flex-col gap-8 relative overflow-hidden animate-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-monarch-crimson to-transparent opacity-70"></div>
        
        <header className="text-center flex flex-col gap-2 relative">
          <div className="absolute -top-4 left-0 w-2 h-2 bg-monarch-crimson shadow-[0_0_8px_#e11d48] animate-pulse"></div>
          <h1 className="font-monarch-display text-headline-status-mobile text-monarch-crimson tracking-tighter uppercase crimson-text-glow flicker">
            Awakening
          </h1>
          <p className="font-label-system text-label-system text-on-surface-variant uppercase opacity-80 tracking-[0.2em]">
            New Hunter Registration
          </p>
        </header>

        {errors.detail && (
          <div className="bg-error-container/20 border border-error/50 text-error p-3 rounded text-sm text-center">
            {errors.detail}
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          
          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between">
              <span>Hunter Designation (Username)</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">badge</span>
              <input 
                type="text" 
                required 
                placeholder="Choose your hunter name" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-4 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
              />
            </div>
            {errors.username && <div className="text-error text-xs">{errors.username}</div>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between">
              <span>Comms Link (Email)</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">mail</span>
              <input 
                type="email" 
                required 
                placeholder="your@email.com" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-4 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            {errors.email && <div className="text-error text-xs">{errors.email}</div>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between">
              <span>Authorization Key</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">key</span>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8}
                placeholder="Minimum 8 characters" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-10 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-monarch-crimson transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <div className="text-error text-xs">{errors.password}</div>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-system text-[10px] text-primary uppercase flex justify-between">
              <span>Confirm Key</span>
              <span className="text-on-surface-variant/50">[REQ]</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-monarch-crimson/70 text-sm">key</span>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8}
                placeholder="Confirm your password" 
                className="hud-input w-full bg-surface-container-lowest/50 rounded pl-10 pr-4 py-3 font-body-main text-sm text-primary-fixed placeholder:text-outline-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
                value={form.password_confirm}
                onChange={(e) => updateField('password_confirm', e.target.value)}
              />
            </div>
            {errors.password_confirm && <div className="text-error text-xs">{errors.password_confirm}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-system text-[10px] text-primary uppercase">Starting Focus</label>
              <select 
                className="hud-input w-full bg-surface-container-lowest/50 rounded p-3 font-body-main text-sm text-primary-fixed focus:ring-0 focus:border-monarch-crimson transition-colors appearance-none"
                value={form.fitness_goal}
                onChange={(e) => updateField('fitness_goal', e.target.value)}
              >
                <option value="strength">⚔️ Strength</option>
                <option value="endurance">🛡️ Endurance</option>
                <option value="flexibility">🌊 Flexibility</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-system text-[10px] text-primary uppercase">Experience</label>
              <select 
                className="hud-input w-full bg-surface-container-lowest/50 rounded p-3 font-body-main text-sm text-primary-fixed focus:ring-0 focus:border-monarch-crimson transition-colors appearance-none"
                value={form.experience_level}
                onChange={(e) => updateField('experience_level', e.target.value)}
              >
                <option value="beginner">E-Rank (Beginner)</option>
                <option value="intermediate">C-Rank (Med)</option>
                <option value="advanced">A-Rank (Pro)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              id="register-btn" 
              type="submit" 
              disabled={loading}
              className="monarch-btn w-full rounded py-4 font-label-system text-label-system uppercase tracking-widest flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Initializing...' : 'Awaken as a Hunter'}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
            </button>
          </div>
        </form>

        <footer className="flex justify-center mt-2 pt-6 border-t border-monarch-crimson/20">
          <Link to="/login" className="font-label-system text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">login</span>
            Return to Login
          </Link>
        </footer>

        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-monarch-crimson/50 to-transparent"></div>
      </div>
    </div>
  );
}
