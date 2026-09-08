/**
 * SystemToastContainer
 * Renders all active system toasts in a fixed container at the top of the screen.
 * Each toast slides in from the top with a glowing "System" style panel.
 */

import React from 'react';
import { useSystemNotification } from '../context/SystemNotificationContext';

const TOAST_CONFIG = {
  system:      { icon: 'smart_toy',         color: 'text-blue-400',   border: 'border-blue-500/40',   bg: 'bg-blue-900/30',   label: 'SYSTEM' },
  quest:       { icon: 'assignment_turned_in', color: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-900/30', label: 'QUEST' },
  achievement: { icon: 'military_tech',       color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-900/20', label: 'ACHIEVEMENT' },
  pr:          { icon: 'emoji_events',        color: 'text-emerald-400',border: 'border-emerald-500/40',bg: 'bg-emerald-900/30',label: 'NEW RECORD' },
  info:        { icon: 'info',                color: 'text-sky-400',    border: 'border-sky-500/40',    bg: 'bg-sky-900/30',    label: 'INFO' },
};

export default function SystemToastContainer() {
  const { toasts } = useSystemNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md z-[200] flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map(toast => {
        const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.system;
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-lg
              border ${cfg.border} ${cfg.bg}
              backdrop-blur-md shadow-lg
              animate-slide-in-top
            `}
          >
            <span className={`material-symbols-outlined text-xl ${cfg.color} flex-shrink-0 mt-0.5`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {cfg.icon}
            </span>
            <div className="flex flex-col min-w-0">
              <span className={`text-[9px] font-mono tracking-[0.2em] ${cfg.color} opacity-70 mb-0.5`}>
                [ {cfg.label} ]
              </span>
              <span className="text-white text-sm font-medium leading-tight break-words">
                {toast.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
