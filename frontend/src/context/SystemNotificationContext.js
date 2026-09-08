/**
 * SystemNotificationContext
 * Provides a global queue-based notification system for Solo Leveling-style
 * system toasts, level-up overlays, rank-up overlays, and achievement popups.
 *
 * Usage:
 *   const { notify, showLevelUp, showRankUp } = useSystemNotification();
 *   notify({ type: 'quest', message: '[System] Quest Complete: Leg Day' });
 *   showLevelUp({ newLevel: 5, xpEarned: 120 });
 *   showRankUp({ newRank: 'B', title: 'Iron Knight' });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SystemNotificationContext = createContext(null);

export function useSystemNotification() {
  return useContext(SystemNotificationContext);
}

export function SystemNotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);         // System toasts (top sliding banner)
  const [levelUpData, setLevelUpData] = useState(null);   // Full-screen level-up overlay
  const [rankUpData, setRankUpData] = useState(null);     // Full-screen rank-up overlay
  const [achievementData, setAchievementData] = useState(null); // Achievement unlock popup
  const toastIdRef = useRef(0);

  /**
   * Fire a system toast notification.
   * @param {object} opts
   * @param {'system'|'quest'|'achievement'|'pr'|'info'} opts.type
   * @param {string} opts.message
   * @param {number} [opts.duration=3500]
   */
  const notify = useCallback(({ type = 'system', message, duration = 3500 }) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  /**
   * Trigger the full-screen level-up overlay.
   * @param {object} opts
   * @param {number} opts.newLevel
   * @param {number} opts.xpEarned
   */
  const showLevelUp = useCallback(({ newLevel, xpEarned }) => {
    setLevelUpData({ newLevel, xpEarned });
  }, []);

  const dismissLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  /**
   * Trigger the full-screen rank-up overlay.
   * @param {object} opts
   * @param {string} opts.newRank  e.g. 'B'
   */
  const showRankUp = useCallback(({ newRank }) => {
    setRankUpData({ newRank });
  }, []);

  const dismissRankUp = useCallback(() => {
    setRankUpData(null);
  }, []);

  /**
   * Show an achievement unlock popup.
   */
  const showAchievement = useCallback((achievement) => {
    setAchievementData(achievement);
    setTimeout(() => setAchievementData(null), 5000);
  }, []);

  return (
    <SystemNotificationContext.Provider value={{
      notify,
      showLevelUp,
      showRankUp,
      showAchievement,
      toasts,
      levelUpData,
      dismissLevelUp,
      rankUpData,
      dismissRankUp,
      achievementData,
    }}>
      {children}
    </SystemNotificationContext.Provider>
  );
}
