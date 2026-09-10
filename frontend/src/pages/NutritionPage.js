import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function NutritionPage() {
  const [todayLog, setTodayLog] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    water_ml: 0,
    calorie_target: 2200,
    water_target_ml: 3000,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [today, past7Days] = await Promise.all([
        api.getTodayNutrition(),
        api.getNutritionHistory(7),
      ]);
      setTodayLog(today);
      setHistory(past7Days);
      setEditForm({
        calories: today.calories,
        protein_g: today.protein_g,
        carbs_g: today.carbs_g,
        fat_g: today.fat_g,
        water_ml: today.water_ml,
        calorie_target: today.calorie_target,
        water_target_ml: today.water_target_ml,
      });
    } catch (err) {
      console.error('Failed to load nutrition:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick potion additions
  const handleQuickAdd = async (deltas) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updated = await api.quickLogNutrition(deltas);
      setTodayLog(updated);
      setEditForm(prev => ({
        ...prev,
        calories: updated.calories,
        protein_g: updated.protein_g,
        carbs_g: updated.carbs_g,
        fat_g: updated.fat_g,
        water_ml: updated.water_ml,
      }));
    } catch (err) {
      console.error('Failed to quick add nutrition:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await api.updateTodayNutrition(editForm);
      setTodayLog(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update nutrition:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !todayLog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const waterPercent = todayLog.water_target_ml > 0
    ? Math.min(Math.round((todayLog.water_ml / todayLog.water_target_ml) * 100), 100)
    : 0;

  const caloriePercent = todayLog.calorie_target > 0
    ? Math.min(Math.round((todayLog.calories / todayLog.calorie_target) * 100), 100)
    : 0;

  return (
    <div className="space-y-panel-gap flex flex-col pb-6">

      {/* Header Banner */}
      <section className="glass-panel rounded-xl p-4 flex justify-between items-center">
        <div>
          <span className="font-label-system text-[10px] text-tertiary tracking-widest uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            SUPPLY DEPOT // RECOVERY
          </span>
          <h2 className="font-category-header text-xl text-primary font-bold tracking-wide mt-0.5">
            Mana & Fuel Reservoir
          </h2>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="monarch-btn px-3 py-1.5 rounded-lg text-xs font-mono text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">tune</span>
          ADJUST
        </button>
      </section>

      {/* ── MANA BAR: Water Reservoir ── */}
      <section className="glass-panel rounded-xl p-5 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] animate-pulse">water_drop</span>
              <span>Mana Reservoir (Hydration)</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-monarch-display text-3xl font-extrabold text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                {todayLog.water_ml}
              </span>
              <span className="font-mono text-xs text-cyan-400/80">
                / {todayLog.water_target_ml} ml
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-monarch-display text-2xl font-bold text-cyan-300">
              {waterPercent}%
            </span>
            <div className="text-[9px] font-mono text-cyan-400/60 uppercase">CHARGE</div>
          </div>
        </div>

        {/* Liquid Mana Bar Container */}
        <div className="relative w-full h-6 bg-cyan-950/40 rounded-full border border-cyan-500/40 overflow-hidden shadow-inner p-0.5 mb-4">
          <div
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{
              width: `${waterPercent}%`,
              background: 'linear-gradient(90deg, #0284c7, #06b6d4, #38bdf8)',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
            }}
          >
            {/* Shimmer line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>

        {/* Quick Elixirs */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <button
            onClick={() => handleQuickAdd({ water_ml_delta: 250 })}
            disabled={updating}
            className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 py-2 px-2 rounded-lg flex flex-col items-center transition-all active:scale-95"
          >
            <span className="text-[10px] text-cyan-400/70">MINI POTION</span>
            <span className="font-bold mt-0.5">+250ml</span>
          </button>

          <button
            onClick={() => handleQuickAdd({ water_ml_delta: 500 })}
            disabled={updating}
            className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 py-2 px-2 rounded-lg flex flex-col items-center transition-all active:scale-95"
          >
            <span className="text-[10px] text-cyan-400/70">ELIXIR</span>
            <span className="font-bold mt-0.5">+500ml</span>
          </button>

          <button
            onClick={() => handleQuickAdd({ water_ml_delta: 1000 })}
            disabled={updating}
            className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 py-2 px-2 rounded-lg flex flex-col items-center transition-all active:scale-95"
          >
            <span className="text-[10px] text-cyan-400/70">FULL FLASK</span>
            <span className="font-bold mt-0.5">+1000ml</span>
          </button>
        </div>
      </section>

      {/* ── COMBAT FUEL: Calories & Macros ── */}
      <section className="glass-panel rounded-xl p-5 border border-primary-container/30 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5 text-primary font-mono text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
            <span>Combat Fuel (Calories & Macros)</span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">
            Target: {todayLog.calorie_target} kcal
          </span>
        </div>

        {/* Calorie Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-monarch-display text-2xl font-bold text-primary">
              {todayLog.calories} <span className="text-sm font-normal text-on-surface-variant font-mono">kcal</span>
            </span>
            <span className="font-mono text-xs font-bold text-primary-container">
              {caloriePercent}%
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container/60 rounded-full border border-primary-container/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-monarch-crimson to-primary-container rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]"
              style={{ width: `${caloriePercent}%` }}
            ></div>
          </div>
        </div>

        {/* 3 Macro Cards */}
        <div className="grid grid-cols-3 gap-2.5 font-mono text-center mb-4">
          {/* Protein (STR recovery) */}
          <div className="bg-surface-container/70 p-3 rounded-lg border border-primary-container/20">
            <div className="text-[10px] text-primary/80 uppercase">PROTEIN (STR)</div>
            <div className="text-lg font-bold text-primary mt-0.5">{todayLog.protein_g}g</div>
            <div className="text-[9px] text-on-surface-variant mt-0.5">
              / {todayLog.protein_target_g}g
            </div>
          </div>

          {/* Carbs (Mana fuel) */}
          <div className="bg-surface-container/70 p-3 rounded-lg border border-primary-container/20">
            <div className="text-[10px] text-tertiary uppercase">CARBS (END)</div>
            <div className="text-lg font-bold text-tertiary mt-0.5">{todayLog.carbs_g}g</div>
            <div className="text-[9px] text-on-surface-variant mt-0.5">
              / {todayLog.carbs_target_g}g
            </div>
          </div>

          {/* Fats (Vitality) */}
          <div className="bg-surface-container/70 p-3 rounded-lg border border-primary-container/20">
            <div className="text-[10px] text-amber-300 uppercase">FATS (VIT)</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{todayLog.fat_g}g</div>
            <div className="text-[9px] text-on-surface-variant mt-0.5">
              / {todayLog.fat_target_g}g
            </div>
          </div>
        </div>

        {/* Quick Macro Add Presets */}
        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={() => handleQuickAdd({ protein_g_delta: 30, calories_delta: 180 })}
            disabled={updating}
            className="flex-1 monarch-btn py-2 px-2 rounded-lg text-primary text-[11px] flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            +30g Shake
          </button>
          <button
            onClick={() => handleQuickAdd({ protein_g_delta: 40, carbs_g_delta: 60, fat_g_delta: 15, calories_delta: 550 })}
            disabled={updating}
            className="flex-1 monarch-btn py-2 px-2 rounded-lg text-tertiary border-tertiary/40 hover:bg-tertiary/10 text-[11px] flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">restaurant</span>
            +Meal (550k)
          </button>
        </div>
      </section>

      {/* ── 7-DAY HYDRATION & CONSISTENCY SPARKLINE ── */}
      <section className="glass-panel rounded-xl p-4">
        <h3 className="font-mono text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-tertiary">calendar_view_week</span>
          7-Day Hydration Consistency
        </h3>

        <div className="grid grid-cols-7 gap-1.5 font-mono text-center">
          {history.map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
            const isFull = day.water_percent >= 100;
            const barHeight = Math.max(12, Math.min(day.water_percent, 100));

            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-full h-20 bg-surface-container/50 rounded-lg p-1 flex flex-col justify-end items-center border border-primary-container/10">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${isFull ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-cyan-700/60'}`}
                    style={{ height: `${barHeight}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1.5">{dayName}</span>
                <span className="text-[9px] text-cyan-300 font-bold">{day.water_ml}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── EDIT / ADJUST MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-5 border border-primary-container/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-category-header text-lg text-primary font-bold">
                Adjust Intake & Targets
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-primary p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-on-surface-variant block mb-1">Water (ml)</label>
                  <input
                    type="number"
                    value={editForm.water_ml}
                    onChange={(e) => setEditForm({ ...editForm, water_ml: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-2 text-primary"
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant block mb-1">Target (ml)</label>
                  <input
                    type="number"
                    value={editForm.water_target_ml}
                    onChange={(e) => setEditForm({ ...editForm, water_target_ml: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-2 text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-on-surface-variant block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={editForm.calories}
                    onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-2 text-primary"
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant block mb-1">Target (kcal)</label>
                  <input
                    type="number"
                    value={editForm.calorie_target}
                    onChange={(e) => setEditForm({ ...editForm, calorie_target: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-2 text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <label className="text-on-surface-variant block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editForm.protein_g}
                    onChange={(e) => setEditForm({ ...editForm, protein_g: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-1.5 text-primary"
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={editForm.carbs_g}
                    onChange={(e) => setEditForm({ ...editForm, carbs_g: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-1.5 text-tertiary"
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={editForm.fat_g}
                    onChange={(e) => setEditForm({ ...editForm, fat_g: parseInt(e.target.value) || 0 })}
                    className="w-full hud-input rounded p-1.5 text-amber-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-surface-container py-2.5 rounded-lg text-on-surface-variant hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 monarch-btn py-2.5 rounded-lg text-primary font-bold"
                >
                  {updating ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
