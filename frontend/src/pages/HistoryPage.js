import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import api from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Aggregate finished sessions into weekly XP buckets (last 12 weeks). */
function buildVolumeChartData(sessions) {
  const buckets = {};

  sessions.forEach((s) => {
    if (!s.started_at) return;
    const date = new Date(s.started_at);
    const jan1 = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `W${String(weekNum).padStart(2, '0')}`;
    buckets[key] = (buckets[key] || 0) + (s.xp_earned || 0);
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, xp]) => ({ week, xp }));
}

/** Build heatmap values — session count per day over last 4 months. */
function buildHeatmapValues(sessions) {
  const counts = {};
  sessions.forEach((s) => {
    if (!s.started_at) return;
    const day = s.started_at.slice(0, 10);
    counts[day] = (counts[day] || 0) + 1;
  });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

function heatmapClass(value) {
  if (!value || value.count === 0) return 'color-empty';
  if (value.count === 1) return 'color-scale-1';
  if (value.count === 2) return 'color-scale-2';
  if (value.count === 3) return 'color-scale-3';
  return 'color-scale-4';
}

function VolumeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container border border-primary/40 rounded px-3 py-1.5 text-xs font-mono shadow-lg">
      <div className="text-on-surface-variant">{label}</div>
      <div className="text-primary font-bold">+{payload[0].value} XP</div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.getSessions();
        setSessions((data.results || data).filter((s) => s.finished_at));
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const viewDetail = async (session) => {
    setDetailLoading(true);
    try {
      const data = await api.getSession(session.id);
      setSelectedSession(data);
    } catch (err) {
      console.error('Failed to load session detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const groupedSets = {};
  if (selectedSession?.sets) {
    selectedSession.sets.forEach((set) => {
      if (!groupedSets[set.exercise]) {
        groupedSets[set.exercise] = { name: set.exercise_name, stat: set.exercise_stat, sets: [] };
      }
      groupedSets[set.exercise].sets.push(set);
    });
  }

  const volumeData = buildVolumeChartData(sessions);
  const heatmapValues = buildHeatmapValues(sessions);
  const today = new Date();
  const heatmapStart = new Date(today);
  heatmapStart.setMonth(heatmapStart.getMonth() - 4);

  return (
    <div className="space-y-panel-gap">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-container">history</span>
        <h1 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">Quest History</h1>
      </div>

      {/* ── Volume Chart ─────────────────────────────────────────────────── */}
      {!loading && sessions.length > 0 && (
        <>
          <section className="glass-panel rounded-xl p-4 animate-in">
            <div className="flex items-center gap-2 mb-3 border-b border-primary-container/20 pb-2">
              <span className="material-symbols-outlined text-primary-container text-base">bar_chart</span>
              <h2 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">
                XP Volume — Last 12 Weeks
              </h2>
            </div>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={volumeData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="week"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(225,29,72,0.08)' }} />
                  <Bar dataKey="xp" radius={[3, 3, 0, 0]} maxBarSize={28}>
                    {volumeData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={idx === volumeData.length - 1 ? '#e11d48' : 'rgba(225,29,72,0.45)'}
                        style={idx === volumeData.length - 1 ? { filter: 'drop-shadow(0 0 6px rgba(225,29,72,0.8))' } : {}}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-on-surface-variant text-xs italic py-6">
                Complete workouts across multiple weeks to see your volume trend.
              </p>
            )}
          </section>

          {/* ── Calendar Heatmap ───────────────────────────────────────────── */}
          <section className="glass-panel rounded-xl p-4 animate-in delay-100">
            <div className="flex items-center gap-2 mb-3 border-b border-primary-container/20 pb-2">
              <span className="material-symbols-outlined text-primary-container text-base">calendar_month</span>
              <h2 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">
                Consistency Map
              </h2>
            </div>
            <div className="overflow-x-auto">
              <CalendarHeatmap
                startDate={heatmapStart}
                endDate={today}
                values={heatmapValues}
                classForValue={heatmapClass}
                tooltipDataAttrs={(value) =>
                  value && value.date
                    ? { 'data-tip': `${value.date}: ${value.count} session${value.count !== 1 ? 's' : ''}` }
                    : { 'data-tip': 'No sessions' }
                }
                showWeekdayLabels
              />
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span className="text-[9px] text-on-surface-variant font-mono">Less</span>
              {['color-empty', 'color-scale-1', 'color-scale-2', 'color-scale-3', 'color-scale-4'].map((cls) => (
                <svg key={cls} width="10" height="10" viewBox="0 0 10 10">
                  <rect width="10" height="10" rx="2" className={`react-calendar-heatmap ${cls}`} />
                </svg>
              ))}
              <span className="text-[9px] text-on-surface-variant font-mono">More</span>
            </div>
          </section>
        </>
      )}

      {/* ── Session List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center opacity-70 border-dashed border-2">
          <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
          <div className="font-label-system text-[10px] uppercase tracking-widest text-on-surface-variant">No completed quests yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className={`glass-panel p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors animate-in delay-${(idx % 4) * 100}`}
              onClick={() => viewDetail(session)}
            >
              <div>
                <div className="font-body-main font-semibold text-primary">{session.name}</div>
                <div className="text-[10px] text-on-surface-variant mt-1 font-label-system tracking-wider uppercase">
                  {new Date(session.started_at).toLocaleDateString()} • {session.set_count} Sets
                </div>
              </div>
              <div className="font-stat-value text-sm text-tertiary drop-shadow-[0_0_5px_rgba(116,216,189,0.4)]">
                +{session.xp_earned} XP
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
          <div className="glass-panel w-full max-w-md max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-primary-container/20 flex justify-between items-center bg-surface-container-low">
              <h3 className="font-label-system text-primary tracking-widest uppercase truncate">{selectedSession.name}</h3>
              <button className="text-on-surface-variant" onClick={() => setSelectedSession(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-6">
              {detailLoading ? (
                <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 bg-surface-container/50 p-3 rounded-lg border border-surface-variant">
                    <div className="text-center">
                      <div className="text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Date</div>
                      <div className="font-label-system text-xs text-on-surface">{new Date(selectedSession.started_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-center border-l border-surface-variant/50">
                      <div className="text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Duration</div>
                      <div className="font-label-system text-xs text-on-surface">{selectedSession.duration_minutes || 0}m</div>
                    </div>
                    <div className="text-center border-l border-surface-variant/50">
                      <div className="text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">XP Earned</div>
                      <div className="font-stat-value text-sm text-tertiary">+{selectedSession.xp_earned}</div>
                    </div>
                  </div>

                  {Object.entries(groupedSets).map(([exerciseId, group]) => (
                    <div key={exerciseId} className="border border-surface-variant/50 rounded-lg overflow-hidden">
                      <div className="bg-surface-container/80 p-2 flex justify-between items-center border-b border-surface-variant/50">
                        <span className="font-body-main text-sm font-semibold text-primary">{group.name}</span>
                        <span className="text-[9px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded font-label-system uppercase tracking-wider">
                          {group.stat}
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        {group.sets.map((set) => (
                          <div key={set.id} className="flex justify-between items-center text-xs px-2 py-1 bg-surface-container-lowest/50 rounded">
                            <span className="font-stat-value text-on-surface-variant w-6">{set.set_number}</span>
                            <span className="text-on-surface text-center flex-1">{set.reps} reps</span>
                            <span className="text-on-surface text-right w-12">{set.weight_kg ? `${set.weight_kg}kg` : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
