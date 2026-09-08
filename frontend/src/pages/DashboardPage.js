import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RANK_COLORS = {
  E: 'text-slate-400',
  D: 'text-stone-400',
  C: 'text-emerald-400',
  B: 'text-blue-400',
  A: 'text-violet-400',
  S: 'text-yellow-400',
};

const QUEST_TYPE_COLORS = {
  daily: { badge: 'bg-blue-900/40 border-blue-500/30 text-blue-300', icon: 'today' },
  weekly: { badge: 'bg-violet-900/40 border-violet-500/30 text-violet-300', icon: 'date_range' },
};

export default function DashboardPage() {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashData, questData] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayQuests(),
        refreshProfile(),
      ]);
      setStats(dashData);
      setQuests(questData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const xpPercent = user.xp_for_next_level > 0
    ? Math.min((user.xp_progress / user.xp_for_next_level) * 100, 100)
    : 0;

  const rankColor = RANK_COLORS[user.rank] || 'text-slate-400';

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed').length;
  const totalQuests = quests.length;
  const weeklyQuest = quests.find(q => q.quest_type === 'weekly');

  // Weekly ring progress — completed workouts this week vs goal
  const weeklyGoal = weeklyQuest?.goal_target || 5;
  const weeklyDone = stats?.week_sessions || 0;
  const weeklyPct = Math.min((weeklyDone / weeklyGoal) * 100, 100);
  const ringR = 28;
  const ringCirc = 2 * Math.PI * ringR;

  return (
    <div className="space-y-panel-gap flex flex-col">

      {/* ── Player Card ── */}
      <section className="glass-panel rounded-xl p-4 animate-in">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-full border-2 border-primary-container overflow-hidden shadow-[0_0_15px_rgba(225,29,72,0.3)] bg-surface-container-high flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {user.username?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-category-header text-category-header text-primary drop-shadow-[0_0_5px_rgba(225,29,72,0.5)] truncate">
              Hunter {user.username}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-label-system text-label-system text-on-surface-variant">LVL {user.level}</span>
              <span className="w-1 h-1 rounded-full bg-primary-container/50"></span>
              <span className={`font-label-system text-label-system font-bold ${rankColor}`}>{user.rank}-RANK</span>
              <span className="w-1 h-1 rounded-full bg-primary-container/50"></span>
              <span className="font-label-system text-label-system text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                {user.current_streak || 0}d streak
              </span>
            </div>
          </div>

          {/* Weekly ring */}
          <div className="flex flex-col items-center flex-shrink-0">
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r={ringR} fill="none" stroke="rgba(225,29,72,0.15)" strokeWidth="5" />
              <circle
                cx="34" cy="34" r={ringR}
                fill="none"
                stroke="#e11d48"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc - (ringCirc * weeklyPct / 100)}
                transform="rotate(-90 34 34)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(225,29,72,0.6))', transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <text x="34" y="34" textAnchor="middle" dominantBaseline="central" fill="#e11d48" fontSize="13" fontWeight="bold"
                fontFamily="monospace">{weeklyDone}/{weeklyGoal}</text>
            </svg>
            <span className="text-[9px] text-on-surface-variant font-mono tracking-wide mt-0.5">WEEKLY</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between font-label-system text-[10px] text-on-surface-variant">
            <span>XP to LEVEL {user.level + 1}</span>
            <span>{user.xp_progress} / {user.xp_for_next_level}</span>
          </div>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden border border-surface-variant">
            <div
              className="h-full shimmer-bg rounded-full shadow-[0_0_10px_rgba(225,29,72,0.6)]"
              style={{ width: `${xpPercent}%`, transition: 'width 1s ease' }}
            ></div>
          </div>
        </div>
      </section>

      {/* ── RPG Stats ── */}
      <section className="glass-panel rounded-xl p-4 animate-in delay-100">
        <div className="flex items-center gap-2 mb-4 border-b border-primary-container/20 pb-2">
          <span className="material-symbols-outlined text-primary-container">equalizer</span>
          <h3 className="font-label-system text-label-system text-primary-container">ATTRIBUTES</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'STR', value: user.stat_str, desc: 'Strength', icon: 'fitness_center' },
            { label: 'VIT', value: user.stat_vit, desc: 'Vitality', icon: 'favorite' },
            { label: 'AGI', value: user.stat_agi, desc: 'Agility', icon: 'directions_run' },
            { label: 'END', value: user.stat_end, desc: 'Endurance', icon: 'timer' },
            { label: 'FLX', value: user.stat_flx, desc: 'Flexibility', icon: 'self_improvement' },
            { label: 'PER', value: user.stat_per, desc: 'Perception', icon: 'visibility' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center bg-surface-container/30 p-3 rounded-lg border border-surface-variant hover:border-primary-container/40 transition-all">
              <span className="material-symbols-outlined text-primary/40 text-sm mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <span className="font-label-system text-[9px] text-on-surface-variant tracking-widest">{stat.label}</span>
              <span className="font-stat-value text-stat-value text-primary drop-shadow-[0_0_5px_rgba(225,29,72,0.4)] mt-0.5">
                {stat.value || 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Active Quests ── */}
      <section className="rounded-xl p-4 bg-error-container/20 border pulse-border animate-in delay-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.1),transparent)]"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error drop-shadow-[0_0_5px_rgba(255,180,171,0.6)]">warning</span>
              <h3 className="font-category-header text-category-header text-error drop-shadow-[0_0_5px_rgba(255,180,171,0.6)] uppercase">
                Active Quests
              </h3>
            </div>
            {totalQuests > 0 && (
              <span className="text-xs font-mono text-on-surface-variant">{completedQuests}/{totalQuests} done</span>
            )}
          </div>

          {activeQuests.length === 0 && (
            <p className="text-on-surface-variant text-sm italic text-center py-2">
              {completedQuests > 0 ? '✓ All quests complete for today!' : 'Loading quests...'}
            </p>
          )}

          <ul className="space-y-3">
            {activeQuests.map((quest) => {
              const cfg = QUEST_TYPE_COLORS[quest.quest_type] || QUEST_TYPE_COLORS.daily;
              return (
                <li key={quest.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider border flex-shrink-0 mt-0.5 ${cfg.badge}`}>
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                      {quest.quest_type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-label-system text-label-system text-on-surface font-semibold">{quest.title}</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">{quest.description}</div>
                    </div>
                    <div className="text-emerald-400 text-xs font-mono flex-shrink-0">+{quest.xp_reward} XP</div>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-error to-primary rounded-full"
                        style={{ width: `${quest.progress_pct}%`, transition: 'width 0.5s ease' }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant flex-shrink-0">
                      {quest.goal_current}/{quest.goal_target}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Completed quests preview */}
          {completedQuests > 0 && (
            <div className="mt-3 pt-3 border-t border-primary-container/10">
              {quests.filter(q => q.status === 'completed').map(quest => (
                <div key={quest.id} className="flex items-center gap-2 opacity-50 mb-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                  <span className="text-xs text-on-surface-variant line-through">{quest.title}</span>
                  <span className="ml-auto text-[10px] text-emerald-400 font-mono">+{quest.xp_reward} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Clears ── */}
      <section className="glass-panel rounded-xl p-4 animate-in delay-300">
        <div className="flex items-center justify-between mb-4 border-b border-primary-container/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">history</span>
            <h3 className="font-label-system text-label-system text-primary-container">RECENT CLEARS</h3>
          </div>
          {stats && (
            <span className="text-[10px] font-mono text-on-surface-variant">{stats.total_sessions} total</span>
          )}
        </div>
        <div className="space-y-3">
          {stats?.recent_sessions && stats.recent_sessions.length > 0 ? (
            stats.recent_sessions.map((session) => (
              <div key={session.id} className="flex justify-between items-center p-3 bg-surface-container/20 rounded hover:bg-primary-container/5 transition-colors border border-transparent hover:border-primary-container/30">
                <div className="flex flex-col min-w-0">
                  <span className="font-body-main font-semibold text-on-surface truncate">{session.name}</span>
                  <span className="font-label-system text-[10px] text-on-surface-variant mt-1">
                    {new Date(session.started_at).toLocaleDateString()} · {session.set_count} sets
                    {session.duration_minutes ? ` · ${session.duration_minutes}m` : ''}
                  </span>
                </div>
                <div className="font-stat-value text-[16px] text-tertiary drop-shadow-[0_0_5px_rgba(116,216,189,0.4)] flex-shrink-0 ml-3">
                  +{session.xp_earned} XP
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-on-surface-variant text-sm italic">
              No dungeons cleared yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
