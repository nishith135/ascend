/**
 * RankUpOverlay
 * More dramatic than LevelUpOverlay — shown on rank promotions.
 * Uses crimson/violet palette with the rank letter as the centrepiece.
 */

import React, { useEffect, useState } from 'react';
import { useSystemNotification } from '../context/SystemNotificationContext';

const RANK_CONFIG = {
  D: { color: 'from-stone-600 to-stone-400', glow: 'rgba(120,113,108,0.8)', ring: 'rgba(120,113,108,0.4)', title: 'Iron Hunter' },
  C: { color: 'from-emerald-600 to-emerald-300', glow: 'rgba(52,211,153,0.8)', ring: 'rgba(52,211,153,0.4)', title: 'Gate Breaker' },
  B: { color: 'from-blue-600 to-blue-300', glow: 'rgba(59,130,246,0.8)', ring: 'rgba(59,130,246,0.4)', title: 'Dungeon Lord' },
  A: { color: 'from-violet-600 to-violet-300', glow: 'rgba(139,92,246,0.8)', ring: 'rgba(139,92,246,0.4)', title: 'Elite Hunter' },
  S: { color: 'from-yellow-500 to-amber-200', glow: 'rgba(245,158,11,0.9)', ring: 'rgba(245,158,11,0.5)', title: 'Shadow Monarch' },
};

export default function RankUpOverlay() {
  const { rankUpData, dismissRankUp } = useSystemNotification();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (rankUpData) {
      setAnimateIn(false);
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, [rankUpData]);

  if (!rankUpData) return null;

  const cfg = RANK_CONFIG[rankUpData.newRank] || RANK_CONFIG['D'];

  return (
    <div
      className="fixed inset-0 z-[600] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      onClick={dismissRankUp}
      style={{
        background: `radial-gradient(ellipse at center, ${cfg.ring} 0%, rgba(10,14,26,0.98) 65%)`,
      }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)' }} />

      {/* Particle lines radiating out */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute w-px h-32 origin-bottom opacity-20"
          style={{
            background: `linear-gradient(to top, ${cfg.glow}, transparent)`,
            transform: `rotate(${i * 45}deg) translateY(-150%)`,
            animation: `spin 8s linear infinite`,
            top: '50%', left: '50%',
          }} />
      ))}

      {/* Outer ring */}
      <div className="absolute rounded-full border"
        style={{
          width: 320, height: 320,
          borderColor: cfg.ring,
          boxShadow: `0 0 60px ${cfg.ring}, 0 0 120px ${cfg.ring.replace('0.4', '0.15')}`,
          animation: 'pulse 2s ease-in-out infinite',
        }} />

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center gap-3 text-center px-8 transition-all duration-700 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        {/* Top label */}
        <div className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-60 text-white">
          [ System Notification ]
        </div>

        {/* Rank promotion text */}
        <div className="text-lg font-bold tracking-[0.2em] uppercase text-white/80">
          Rank Promotion
        </div>

        {/* Rank letter — main centrepiece */}
        <div
          className={`text-[110px] font-black bg-gradient-to-b ${cfg.color} bg-clip-text text-transparent leading-none`}
          style={{
            textShadow: `0 0 60px ${cfg.glow}`,
            fontFamily: "'Orbitron', 'Exo 2', monospace",
            filter: `drop-shadow(0 0 30px ${cfg.glow})`,
          }}
        >
          {rankUpData.newRank}
        </div>

        {/* Rank label */}
        <div className="text-xl tracking-[0.3em] font-semibold text-white/70 uppercase">
          {rankUpData.newRank}-Rank
        </div>

        {/* Flavour title */}
        <div className={`text-sm tracking-widest font-medium bg-gradient-to-r ${cfg.color} bg-clip-text text-transparent mt-1`}>
          « {cfg.title} »
        </div>

        <p className="text-white/30 text-xs mt-6 tracking-wide animate-pulse">
          TAP TO CONTINUE
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2" style={{ borderColor: cfg.ring }} />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2" style={{ borderColor: cfg.ring }} />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2" style={{ borderColor: cfg.ring }} />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2" style={{ borderColor: cfg.ring }} />
    </div>
  );
}
