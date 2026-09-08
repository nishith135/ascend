import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
        groupedSets[set.exercise] = {
          name: set.exercise_name,
          stat: set.exercise_stat,
          sets: [],
        };
      }
      groupedSets[set.exercise].sets.push(set);
    });
  }

  return (
    <div className="space-y-panel-gap">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-container">history</span>
        <h1 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">Quest History</h1>
      </div>

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

      {/* Detail Modal */}
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
