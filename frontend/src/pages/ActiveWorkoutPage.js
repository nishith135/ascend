import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSystemNotification } from '../context/SystemNotificationContext';
import api from '../services/api';

export default function ActiveWorkoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { notify, showLevelUp, showRankUp, showAchievement } = useSystemNotification();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);

  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [restTime, setRestTime] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const restRef = useRef(null);

  const startSession = useCallback(async () => {
    try {
      const sessionId = location.state?.sessionId;
      let sessionData;
      if (sessionId) {
        sessionData = await api.getSession(sessionId);
      } else {
        sessionData = await api.startSession({ name: 'Quick Workout' });
      }
      setSession(sessionData);

      if (sessionData.sets && sessionData.sets.length > 0) {
        const groups = {};
        sessionData.sets.forEach((set) => {
          if (!groups[set.exercise]) {
            groups[set.exercise] = {
              exerciseId: set.exercise,
              exerciseName: set.exercise_name,
              exerciseStat: set.exercise_stat,
              loggedSets: [],
              pendingSets: [],
            };
          }
          groups[set.exercise].loggedSets.push({
            id: set.id,
            set_number: set.set_number,
            reps: set.reps,
            weight_kg: set.weight_kg,
            duration_seconds: set.duration_seconds,
          });
        });
        setWorkoutExercises(Object.values(groups));
      }
    } catch (err) {
      console.error('Failed to start/load session:', err);
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    if (!session || session.finished_at) return;
    const startTime = new Date(session.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAddExercise = (exercise) => {
    setShowExercisePicker(false);
    if (workoutExercises.find((e) => e.exerciseId === exercise.id)) return;
    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseStat: exercise.default_stat,
        loggedSets: [],
        pendingSets: [{ reps: '', weight_kg: '' }],
      },
    ]);
  };

  const addPendingRow = (exerciseIndex) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, pendingSets: [...ex.pendingSets, { reps: '', weight_kg: '' }] }
          : ex
      )
    );
  };

  const updatePendingSet = (exerciseIndex, setIndex, field, value) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              pendingSets: ex.pendingSets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const logSet = async (exerciseIndex, setIndex) => {
    const ex = workoutExercises[exerciseIndex];
    const pending = ex.pendingSets[setIndex];
    const reps = parseInt(pending.reps) || 0;
    const weight = parseFloat(pending.weight_kg) || 0;

    if (reps === 0) return;

    const setNumber = ex.loggedSets.length + 1;

    try {
      const result = await api.addSet(session.id, {
        exercise: ex.exerciseId,
        set_number: setNumber,
        reps: reps,
        weight_kg: weight,
      });

      setWorkoutExercises((prev) =>
        prev.map((e, i) =>
          i === exerciseIndex
            ? {
                ...e,
                loggedSets: [
                  ...e.loggedSets,
                  {
                    id: result.id,
                    set_number: setNumber,
                    reps: reps,
                    weight_kg: weight,
                  },
                ],
                pendingSets: e.pendingSets.filter((_, j) => j !== setIndex),
              }
            : e
        )
      );
    } catch (err) {
      console.error('Failed to log set:', err);
    }
  };

  const removeLoggedSet = async (exerciseIndex, setId) => {
    try {
      await api.removeSet(session.id, setId);
      setWorkoutExercises((prev) =>
        prev.map((ex, i) =>
          i === exerciseIndex
            ? { ...ex, loggedSets: ex.loggedSets.filter((s) => s.id !== setId) }
            : ex
        )
      );
    } catch (err) {
      console.error('Failed to remove set:', err);
    }
  };


  const openExercisePicker = async () => {
    setShowExercisePicker(true);
    if (allExercises.length === 0) {
      try {
        const data = await api.getExercises({ page_size: 200 });
        setAllExercises(data.results || data);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    }
  };

  const startRestTimer = (seconds = 90) => {
    setRestTime(seconds);
    setShowRest(true);
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(restRef.current);
          setShowRest(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restRef.current) clearInterval(restRef.current);
    setShowRest(false);
    setRestTime(0);
  };

  const totalLoggedSets = workoutExercises.reduce((acc, ex) => acc + ex.loggedSets.length, 0);

  const handleFinish = async () => {
    if (!session || totalLoggedSets === 0) return;
    setFinishing(true);
    try {
      const result = await api.finishSession(session.id);
      setSession(result);
      setFinished(true);

      // Fire gamification events
      notify({ type: 'quest', message: `[System] Quest Complete — +${result.xp_earned} XP earned` });

      // Level-up takes priority — show after a short delay for drama
      if (result.ranked_up) {
        setTimeout(() => showRankUp({ newRank: result.new_rank }), 800);
      } else if (result.leveled_up) {
        setTimeout(() => showLevelUp({ newLevel: result.new_level, xpEarned: result.xp_earned }), 600);
      }

      // Queue achievement popups after overlays
      if (result.new_achievements && result.new_achievements.length > 0) {
        result.new_achievements.forEach((ua, i) => {
          setTimeout(() => {
            showAchievement(ua);
            notify({ type: 'achievement', message: `Achievement Unlocked: ${ua.achievement.title}` });
          }, (result.ranked_up || result.leveled_up ? 3500 : 500) + i * 5500);
        });
      }

      // Refresh profile so dashboard XP bar updates
      refreshProfile();
    } catch (err) {
      console.error('Failed to finish session:', err);
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass-panel p-6 rounded-xl text-center">
        <span className="material-symbols-outlined text-error text-4xl mb-4">warning</span>
        <div className="text-on-surface-variant mb-6">Failed to initialize Dungeon instance.</div>
        <button className="monarch-btn px-6 py-2 rounded text-sm uppercase tracking-widest" onClick={() => navigate('/')}>
          Return to Status
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center pt-10 animate-in">
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h2 className="font-monarch-display text-headline-status-mobile text-tertiary tracking-tighter uppercase crimson-text-glow mb-2">
          DUNGEON CLEARED
        </h2>
        <p className="font-label-system text-label-system text-on-surface-variant uppercase tracking-widest mb-8">
          {session.name} • {session.duration_minutes || 0} min
        </p>
        
        <div className="glass-panel max-w-sm mx-auto p-6 rounded-xl text-left mb-8">
          <div className="font-label-system text-[10px] text-primary-container mb-4 pb-2 border-b border-primary-container/20">
            REWARDS ACQUIRED
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Experience</div>
              <div className="font-stat-value text-2xl text-tertiary drop-shadow-[0_0_5px_rgba(116,216,189,0.4)]">
                +{session.xp_earned}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Sets Logged</div>
              <div className="font-stat-value text-2xl text-primary">
                {session.sets?.length || totalLoggedSets}
              </div>
            </div>
          </div>
        </div>

        <button className="monarch-btn px-8 py-3 rounded text-sm uppercase tracking-widest" onClick={() => navigate('/')}>
          Exit Dungeon
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-panel-gap">
      {/* Header */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-xl sticky top-4 z-40">
        <div>
          <h1 className="font-category-header text-primary uppercase text-sm truncate max-w-[150px]">
            {session.name}
          </h1>
          <div className="font-stat-value text-xl text-on-surface tracking-wider">
            {formatTime(elapsed)}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-surface-container hover:bg-surface-variant text-on-surface p-2 rounded transition-colors" onClick={openExercisePicker}>
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
          <button
            className="monarch-btn px-4 py-2 rounded font-label-system text-[10px] uppercase tracking-wider disabled:opacity-50"
            onClick={handleFinish}
            disabled={finishing || totalLoggedSets === 0}
          >
            {finishing ? 'Finishing...' : `Complete`}
          </button>
        </div>
      </div>

      {/* Exercise Groups */}
      {workoutExercises.map((ex, exIdx) => (
        <div key={ex.exerciseId} className="glass-panel p-4 rounded-xl animate-in delay-100">
          <div className="flex justify-between items-center mb-4 border-b border-primary-container/20 pb-2">
            <span className="font-body-main font-semibold text-primary">{ex.exerciseName}</span>
            <span className="text-[10px] bg-primary-container/20 text-primary-container px-2 py-1 rounded font-label-system tracking-wider">
              {ex.exerciseStat}
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 mb-2 font-label-system text-[10px] text-on-surface-variant uppercase text-center border-b border-surface-variant/50 pb-2">
            <span className="text-left">Set</span>
            <span>Reps</span>
            <span>Kg</span>
            <span></span>
          </div>

          {/* Logged Sets */}
          {ex.loggedSets.map((set) => (
            <div key={set.id} className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 mb-2 items-center text-center">
              <span className="font-stat-value text-sm text-tertiary text-left">✓{set.set_number}</span>
              <span className="font-stat-value text-on-surface">{set.reps}</span>
              <span className="font-stat-value text-on-surface">{set.weight_kg || '—'}</span>
              <button className="text-on-surface-variant hover:text-error transition-colors" onClick={() => removeLoggedSet(exIdx, set.id)}>
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}

          {/* Pending Sets */}
          {ex.pendingSets.map((pending, setIdx) => (
            <div key={`pending-${setIdx}`} className="grid grid-cols-[30px_1fr_1fr_50px] gap-2 mb-2 items-center text-center">
              <span className="font-stat-value text-sm text-on-surface-variant text-left">{ex.loggedSets.length + setIdx + 1}</span>
              <input
                className="hud-input w-full rounded p-2 text-center font-stat-value text-sm"
                type="number"
                placeholder="0"
                value={pending.reps}
                onChange={(e) => updatePendingSet(exIdx, setIdx, 'reps', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logSet(exIdx, setIdx)}
              />
              <input
                className="hud-input w-full rounded p-2 text-center font-stat-value text-sm"
                type="number"
                placeholder="0"
                value={pending.weight_kg}
                onChange={(e) => updatePendingSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logSet(exIdx, setIdx)}
              />
              <div className="flex gap-1 justify-end">
                <button 
                  className="bg-primary-container/20 text-primary-container hover:bg-primary hover:text-background p-1.5 rounded transition-colors disabled:opacity-30" 
                  onClick={() => logSet(exIdx, setIdx)}
                  disabled={!pending.reps}
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-4 pt-2 border-t border-surface-variant/50">
            <button className="flex-1 bg-surface-container hover:bg-surface-variant text-on-surface text-[10px] font-label-system uppercase tracking-wider py-2 rounded transition-colors" onClick={() => addPendingRow(exIdx)}>
              + Add Set
            </button>
            <button className="flex-1 border border-primary-container/30 text-primary-container hover:bg-primary-container/10 text-[10px] font-label-system uppercase tracking-wider py-2 rounded transition-colors flex items-center justify-center gap-1" onClick={() => startRestTimer(90)}>
              <span className="material-symbols-outlined text-[12px]">timer</span> Rest
            </button>
          </div>
        </div>
      ))}

      {workoutExercises.length === 0 && (
        <div className="glass-panel p-8 rounded-xl text-center opacity-70 border-dashed border-2">
          <span className="material-symbols-outlined text-4xl mb-2">fitness_center</span>
          <div className="font-label-system text-[10px] uppercase tracking-widest text-on-surface-variant">Add an exercise to begin</div>
        </div>
      )}

      {/* Rest Timer Overlay */}
      {showRest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer" onClick={stopRestTimer}>
          <div className="font-label-system text-primary-container tracking-[0.2em] mb-4">REST PERIOD</div>
          <div className="font-stat-value text-7xl text-tertiary drop-shadow-[0_0_20px_rgba(116,216,189,0.5)] mb-8">
            {formatTime(restTime)}
          </div>
          <div className="font-label-system text-[10px] text-on-surface-variant tracking-widest animate-pulse">TAP ANYWHERE TO DISMISS</div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExercisePicker(false)}>
          <div className="glass-panel w-full max-w-md max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-primary-container/20 flex justify-between items-center bg-surface-container-low">
              <h3 className="font-label-system text-primary tracking-widest uppercase">Select Exercise</h3>
              <button className="text-on-surface-variant" onClick={() => setShowExercisePicker(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {allExercises.map((ex) => {
                const alreadyAdded = workoutExercises.find((w) => w.exerciseId === ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => !alreadyAdded && handleAddExercise(ex)}
                    className={`p-3 rounded mb-1 flex justify-between items-center transition-colors ${alreadyAdded ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary-container/10 cursor-pointer border border-transparent hover:border-primary-container/30'}`}
                  >
                    <div>
                      <div className="font-body-main text-sm text-on-surface">{ex.name} {alreadyAdded && '(Added)'}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-label-system text-on-surface-variant uppercase tracking-wider">{ex.muscle_group_display}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
