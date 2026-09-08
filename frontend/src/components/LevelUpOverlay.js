/**
 * LevelUpOverlay
 * Full-screen dramatic overlay triggered when the user levels up.
 * Features a pulsing flash, animated level number count-up, and dismiss on tap.
 */

import React, { useEffect, useState } from 'react';
import { useSystemNotification } from '../context/SystemNotificationContext';

export default function LevelUpOverlay() {
  const { levelUpData, dismissLevelUp } = useSystemNotification();
  const [visible, setVisible] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);

  useEffect(() => {
    if (levelUpData) {
      setVisible(true);
      setDisplayLevel(levelUpData.newLevel - 1); // start from previous level
      // Count-up animation
      let start = levelUpData.newLevel - 1;
      const target = levelUpData.newLevel;
      const step = () => {
        start += 1;
        setDisplayLevel(start);
        if (start < target) requestAnimationFrame(step);
      };
      const timer = setTimeout(() => requestAnimationFrame(step), 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [levelUpData]);

  if (!levelUpData || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center cursor-pointer"
      onClick={dismissLevelUp}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, rgba(10,14,26,0.97) 70%)',
        animation: 'levelUpFlash 0.5s ease-out',
      }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* Glow ring */}
      <div className="absolute w-80 h-80 rounded-full border border-blue-500/30"
        style={{ boxShadow: '0 0 80px rgba(59,130,246,0.3), 0 0 160px rgba(59,130,246,0.1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="absolute w-56 h-56 rounded-full border border-blue-400/20"
        style={{ boxShadow: '0 0 40px rgba(59,130,246,0.4)', animation: 'pulse 1.2s ease-in-out infinite reverse' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-8">
        {/* System label */}
        <div className="font-mono text-xs tracking-[0.3em] text-blue-400 opacity-70 uppercase animate-pulse">
          [ System ]
        </div>

        {/* Main text */}
        <h1
          className="text-2xl font-bold tracking-widest uppercase text-blue-200"
          style={{ textShadow: '0 0 30px rgba(147,197,253,0.8)', letterSpacing: '0.3em' }}
        >
          Level Up
        </h1>

        {/* Big level number */}
        <div
          className="text-8xl font-black text-white"
          style={{
            textShadow: '0 0 40px rgba(59,130,246,1), 0 0 80px rgba(59,130,246,0.5)',
            fontFamily: "'Orbitron', 'Exo 2', monospace",
          }}
        >
          {displayLevel}
        </div>

        {/* XP earned */}
        {levelUpData.xpEarned && (
          <div className="text-blue-300 text-sm font-mono tracking-widest">
            +{levelUpData.xpEarned} XP earned
          </div>
        )}

        {/* Subtext */}
        <p className="text-blue-200/50 text-xs mt-4 tracking-wide animate-pulse">
          TAP TO CONTINUE
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-blue-500/50" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-blue-500/50" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-blue-500/50" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-blue-500/50" />
    </div>
  );
}
