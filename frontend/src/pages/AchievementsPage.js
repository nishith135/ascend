import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RARITY_CONFIG = {
  common:    { border: 'border-slate-700/60',   bg: 'bg-slate-900/40',   glow: '',                                         text: 'text-slate-400',   ring: 'rgba(148,163,184,0.15)', label: 'Common' },
  rare:      { border: 'border-blue-600/50',    bg: 'bg-blue-950/40',    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',  text: 'text-blue-400',    ring: 'rgba(59,130,246,0.2)',   label: 'Rare' },
  epic:      { border: 'border-violet-600/50',  bg: 'bg-violet-950/40',  glow: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]', text: 'text-violet-400',  ring: 'rgba(139,92,246,0.2)',   label: 'Epic' },
  legendary: { border: 'border-yellow-500/60',  bg: 'bg-yellow-950/30',  glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]', text: 'text-yellow-400',  ring: 'rgba(245,158,11,0.25)',  label: 'Legendary' },
};

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked' | rarity

  useEffect(() => {
    api.getAchievements()
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          // Unlocked first, then by rarity, then name
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
          return (RARITY_ORDER[a.rarity] ?? 4) - (RARITY_ORDER[b.rarity] ?? 4);
        });
        setAchievements(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  const displayed = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    if (['common', 'rare', 'epic', 'legendary'].includes(filter)) return a.rarity === filter;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const progressPct = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div className="space-y-panel-gap flex flex-col pb-4">

      {/* ── Header ── */}
      <section className="glass-panel rounded-xl p-4 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-yellow-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            military_tech
          </span>
          <div>
            <h2 className="font-category-header text-category-header text-primary">TITLES & ACHIEVEMENTS</h2>
            <p className="text-xs text-on-surface-variant font-mono">{unlocked} / {total} unlocked</p>
          </div>
        </div>

        {/* Collection progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden border border-surface-variant">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #7c3aed, #fbbf24)',
                boxShadow: '0 0 8px rgba(251,191,36,0.5)',
                transition: 'width 1s ease',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
            <span>Collection Progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
        </div>
      </section>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 flex-wrap animate-in delay-100">
        {['all', 'unlocked', 'locked', 'legendary', 'epic', 'rare', 'common'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all border ${
              filter === f
                ? 'bg-primary/20 border-primary text-primary'
                : 'border-surface-variant text-on-surface-variant hover:border-primary/30'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Achievement Grid ── */}
      <div className="grid grid-cols-2 gap-3 animate-in delay-200">
        {displayed.map((ach) => {
          const cfg = RARITY_CONFIG[ach.rarity] || RARITY_CONFIG.common;
          const isUnlocked = ach.unlocked;

          return (
            <div
              key={ach.key}
              className={`
                relative flex flex-col items-center text-center p-4 rounded-xl border
                ${cfg.border} ${cfg.bg} ${isUnlocked ? cfg.glow : ''}
                ${isUnlocked ? '' : 'opacity-40 grayscale'}
                transition-all duration-300
              `}
            >
              {/* Rarity pip */}
              <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isUnlocked ? cfg.text.replace('text-', 'bg-') : 'bg-slate-700'}`}
                style={{ boxShadow: isUnlocked ? `0 0 6px ${cfg.ring}` : 'none' }} />

              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border ${cfg.border}`}
                style={{ background: 'rgba(0,0,0,0.4)', boxShadow: isUnlocked ? `0 0 15px ${cfg.ring}` : 'none' }}>
                <span className={`material-symbols-outlined text-2xl ${isUnlocked ? cfg.text : 'text-slate-600'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  {ach.icon}
                </span>
              </div>

              {/* Title */}
              <div className={`text-xs font-bold leading-tight mb-1 ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                {ach.title}
              </div>

              {/* Description */}
              <div className="text-[10px] text-on-surface-variant leading-tight mb-2">
                {ach.description}
              </div>

              {/* Rarity label */}
              <div className={`text-[9px] font-mono tracking-widest uppercase ${isUnlocked ? cfg.text : 'text-slate-700'}`}>
                {cfg.label}
              </div>

              {/* XP reward */}
              {ach.xp_reward > 0 && (
                <div className={`text-[9px] font-mono mt-1 ${isUnlocked ? 'text-emerald-400' : 'text-slate-700'}`}>
                  +{ach.xp_reward} XP
                </div>
              )}

              {/* Unlocked date */}
              {isUnlocked && ach.unlocked_at && (
                <div className="text-[9px] text-on-surface-variant/50 mt-1 font-mono">
                  {new Date(ach.unlocked_at).toLocaleDateString()}
                </div>
              )}

              {/* Lock overlay icon */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-slate-700 text-3xl">lock</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant text-sm italic">
          No achievements match this filter.
        </div>
      )}
    </div>
  );
}
