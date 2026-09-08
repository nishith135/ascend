/**
 * AchievementPopup
 * Slides in from the bottom when an achievement is unlocked.
 * Shows the icon, rarity, title and description with rarity-specific gold glow.
 */

import React from 'react';
import { useSystemNotification } from '../context/SystemNotificationContext';

const RARITY_CONFIG = {
  common:    { border: 'border-slate-500/40',  glow: 'shadow-slate-500/20',  text: 'text-slate-300',  label: 'Common' },
  rare:      { border: 'border-blue-500/50',   glow: 'shadow-blue-500/30',   text: 'text-blue-300',   label: 'Rare' },
  epic:      { border: 'border-violet-500/50', glow: 'shadow-violet-500/30', text: 'text-violet-300', label: 'Epic' },
  legendary: { border: 'border-yellow-500/60', glow: 'shadow-yellow-500/40', text: 'text-yellow-300', label: 'Legendary' },
};

export default function AchievementPopup() {
  const { achievementData } = useSystemNotification();

  if (!achievementData) return null;

  const rarity = achievementData.achievement?.rarity || 'common';
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const ach = achievementData.achievement || achievementData;

  return (
    <div className={`
      fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[300]
      flex items-center gap-4 px-4 py-4 rounded-xl
      border ${cfg.border} bg-surface-container/90 backdrop-blur-xl
      shadow-xl ${cfg.glow}
      animate-slide-in-bottom
    `}>
      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
        border ${cfg.border} bg-black/30
      `} style={{ boxShadow: `0 0 20px ${rarity === 'legendary' ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.3)'}` }}>
        <span className={`material-symbols-outlined text-2xl ${cfg.text}`}
          style={{ fontVariationSettings: "'FILL' 1" }}>
          {ach.icon || 'military_tech'}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-mono tracking-[0.25em] text-yellow-400/70 uppercase">
            [ Achievement Unlocked ]
          </span>
        </div>
        <div className="text-white font-semibold text-sm leading-tight truncate">{ach.title}</div>
        <div className="text-white/50 text-xs mt-0.5 truncate">{ach.description}</div>
        <div className={`text-[10px] font-mono mt-1 tracking-wider ${cfg.text} opacity-70`}>
          {cfg.label}
        </div>
      </div>
    </div>
  );
}
