import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MUSCLE_CHIPS = [
  { value: '', label: 'ALL' },
  { value: 'chest', label: 'CHEST' },
  { value: 'back', label: 'BACK' },
  { value: 'shoulders', label: 'SHOULDERS' },
  { value: 'legs', label: 'LEGS' },
  { value: 'arms', label: 'ARMS' },
  { value: 'core', label: 'CORE' },
  { value: 'cardio', label: 'CARDIO' },
  { value: 'flexibility', label: 'FLEX' },
];

const CATEGORY_CHIPS = [
  { value: '', label: 'ALL' },
  { value: 'strength', label: 'STRENGTH' },
  { value: 'cardio', label: 'CARDIO' },
  { value: 'stretching', label: 'STRETCH' },
  { value: 'plyometrics', label: 'PLYO' },
  { value: 'powerlifting', label: 'POWERLIFT' },
];

const MECHANIC_CHIPS = [
  { value: '', label: 'ALL' },
  { value: 'compound', label: 'COMPOUND' },
  { value: 'isolation', label: 'ISOLATION' },
];

const FORCE_CHIPS = [
  { value: '', label: 'ALL' },
  { value: 'push', label: 'PUSH' },
  { value: 'pull', label: 'PULL' },
  { value: 'static', label: 'STATIC' },
];

export default function ExerciseLibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('');
  const [forceFilter, setForceFilter] = useState('');
  const [activeCardId, setActiveCardId] = useState(null);
  const [inspectExercise, setInspectExercise] = useState(null);
  const [showMatrix, setShowMatrix] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch exercises from backend with active filters
  useEffect(() => {
    let isMounted = true;
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (muscleGroup) params.muscle_group = muscleGroup;
        if (categoryFilter) params.category = categoryFilter;
        if (mechanicFilter) params.mechanic = mechanicFilter;
        if (forceFilter) params.force = forceFilter;

        const data = await api.getExercises(params);
        if (isMounted) {
          const list = data.results || (Array.isArray(data) ? data : []);
          setExercises(list);
          setTotalCount(data.count !== undefined ? data.count : list.length);
          if (list.length > 0 && !activeCardId) {
            setActiveCardId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load codex entries:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchExercises, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [search, muscleGroup, categoryFilter, mechanicFilter, forceFilter]);

  // Lock body scroll while inspect modal is open
  useEffect(() => {
    if (inspectExercise) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [inspectExercise]);

  // Compute exercise rank / tier based on level or stats
  const getExerciseRank = (ex) => {
    if (ex.level) {
      if (ex.level.toLowerCase() === 'expert') return 'RANK S-TIER';
      if (ex.level.toLowerCase() === 'intermediate') return 'RANK A-TIER';
      return 'RANK B-TIER';
    }
    const maxStat = Math.max(
      ex.stat_str || 0,
      ex.stat_vit || 0,
      ex.stat_agi || 0,
      ex.stat_end || 0
    );
    if (maxStat >= 1.5) return 'RANK S-TIER';
    if (maxStat >= 1.0) return 'RANK A-TIER';
    return 'RANK B-TIER';
  };

  // Compute dynamic XP reward for completing the exercise
  const getXpBounty = (ex) => {
    const statSum =
      (ex.stat_str || 0) +
      (ex.stat_vit || 0) +
      (ex.stat_agi || 0) +
      (ex.stat_end || 0) +
      (ex.stat_flx || 0);
    if (statSum > 0) {
      return Math.round(90 + statSum * 45);
    }
    return 100;
  };

  // Format stat multiplier badges
  const getStatAllocations = (ex) => {
    const list = [];
    if (ex.stat_str > 0) list.push({ name: 'STR', val: ex.stat_str, color: 'emerald' });
    if (ex.stat_end > 0) list.push({ name: 'END', val: ex.stat_end, color: 'amber' });
    if (ex.stat_vit > 0) list.push({ name: 'VIT', val: ex.stat_vit, color: 'rose' });
    if (ex.stat_agi > 0) list.push({ name: 'AGI', val: ex.stat_agi, color: 'sky' });
    if (ex.stat_flx > 0) list.push({ name: 'FLX', val: ex.stat_flx, color: 'purple' });
    if (ex.stat_per > 0) list.push({ name: 'PER', val: ex.stat_per, color: 'blue' });

    if (list.length === 0 && ex.default_stat) {
      list.push({ name: ex.default_stat, val: 1.0, color: 'emerald' });
    }
    return list.slice(0, 3);
  };

  const hunterRank = user?.rank || 'E';
  const hunterLevel = user?.level || 1;

  return (
    <div className="space-y-3.5 pb-12 font-sans text-monarch-textPrimary">
      {/* Top Protocol Header */}
      <header className="rounded-xl bg-monarch-surface/90 border border-monarch-roseBorder/40 p-3 shadow-crimson-glow">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Navigate Back"
            className="w-8 h-8 rounded-lg bg-monarch-card border border-monarch-roseBorder/50 flex items-center justify-center text-monarch-crimson hover:bg-monarch-crimson hover:text-white transition-all active:scale-95"
            type="button"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-monarch-crimson animate-ping"></span>
              <h1 className="font-display font-black tracking-widest text-base text-monarch-textPrimary uppercase drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                EXERCISE CODEX
              </h1>
            </div>
            <p className="text-[8px] font-mono tracking-wider text-monarch-crimson uppercase font-semibold">
              STATUS WINDOW // HUNTER PROTOCOL
            </p>
          </div>

          {/* Hunter Avatar / Level Badge */}
          <div className="flex items-center gap-1.5 bg-monarch-card px-2 py-1 rounded-lg border border-monarch-roseBorder/40">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-monarch-crimson to-rose-400 flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_8px_rgba(225,29,72,0.8)]">
              {hunterRank}
            </div>
            <span className="text-[9px] font-mono font-bold text-monarch-textSecondary">
              LV.{hunterLevel}
            </span>
          </div>
        </div>

        {/* Engine Taxonomy Banner */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-gradient-to-r from-monarch-accentDim/60 via-monarch-card to-monarch-surface border border-monarch-roseBorder/30">
          <div className="flex items-center gap-1.5">
            <i className="fa-solid fa-microchip text-[10px] text-monarch-crimson"></i>
            <span className="text-[9px] font-mono font-semibold text-monarch-textSecondary uppercase tracking-wide">
              RULE ENGINE TAXONOMY
            </span>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-monarch-crimson/20 text-rose-300 font-mono font-bold border border-monarch-crimson/40">
            {totalCount} INDEXED NODES
          </span>
        </div>
      </header>

      {/* Search and Filters */}
      <section aria-label="Search and Categorization" className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-monarch-crimson">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
          <input
            className="w-full pl-8 pr-8 py-2 bg-monarch-card border border-monarch-roseBorder/40 rounded-xl text-xs text-monarch-textPrimary placeholder-monarch-textMuted focus:outline-none focus:border-monarch-crimson focus:ring-1 focus:ring-monarch-crimson transition-all shadow-inner-glow font-sans"
            placeholder="Search codex by name, mechanic, stat affinity..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-monarch-textMuted hover:text-monarch-crimson"
            >
              <i className="fa-solid fa-times text-xs"></i>
            </button>
          ) : (
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                showMatrix ? 'text-monarch-crimson' : 'text-monarch-textMuted'
              }`}
              title="Toggle Rule Matrix"
            >
              <i className="fa-solid fa-sliders text-xs"></i>
            </button>
          )}
        </div>

        {/* Primary Muscle Topology Chips */}
        <div>
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[9px] font-mono tracking-wider text-monarch-textMuted uppercase">
              Muscle Topology
            </span>
            <span className="text-[9px] font-mono text-monarch-crimson">
              {muscleGroup ? muscleGroup.toUpperCase() : 'ALL NODES'}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {MUSCLE_CHIPS.map((chip) => {
              const active = muscleGroup === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setMuscleGroup(chip.value)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg shrink-0 uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? 'bg-monarch-crimson text-white border border-rose-400/50 shadow-crimson-glow'
                      : 'bg-monarch-card text-monarch-textSecondary border border-monarch-roseBorder/30 hover:border-monarch-roseBorder'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rule Engine Filter Matrix */}
        {showMatrix && (
          <div className="bg-monarch-surface/80 rounded-lg p-2.5 border border-monarch-roseBorder/25 text-[10px] space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono text-monarch-textSecondary">
              <span className="text-rose-400 font-bold uppercase flex items-center gap-1">
                <i className="fa-solid fa-code-fork"></i>
                Rule Engine Filter Matrix:
              </span>
              {(categoryFilter || mechanicFilter || forceFilter) && (
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setMechanicFilter('');
                    setForceFilter('');
                  }}
                  className="text-monarch-crimson hover:underline text-[9px]"
                >
                  CLEAR FILTERS
                </button>
              )}
            </div>

            {/* Category row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold uppercase text-monarch-textMuted w-9">CAT:</span>
              {CATEGORY_CHIPS.map((c) => {
                const active = categoryFilter === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setCategoryFilter(c.value)}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono transition-colors ${
                      active
                        ? 'bg-rose-950/80 border border-monarch-crimson text-rose-200 font-bold shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                        : 'bg-monarch-card border border-monarch-roseBorder/20 text-monarch-textMuted hover:text-monarch-textSecondary'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Mechanic row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold uppercase text-monarch-textMuted w-9">MECH:</span>
              {MECHANIC_CHIPS.map((m) => {
                const active = mechanicFilter === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMechanicFilter(m.value)}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono transition-colors ${
                      active
                        ? 'bg-cyan-950/80 border border-cyan-500/70 text-cyan-200 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                        : 'bg-monarch-card border border-monarch-roseBorder/20 text-monarch-textMuted hover:text-monarch-textSecondary'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Force row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold uppercase text-monarch-textMuted w-9">FORCE:</span>
              {FORCE_CHIPS.map((f) => {
                const active = forceFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setForceFilter(f.value)}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono transition-colors ${
                      active
                        ? 'bg-rose-950/80 border border-monarch-crimson text-rose-200 font-bold shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                        : 'bg-monarch-card border border-monarch-roseBorder/20 text-monarch-textMuted hover:text-monarch-textSecondary'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Exercise Cards List */}
      <main className="space-y-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-9 h-9 border-2 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-[10px] text-monarch-crimson tracking-widest uppercase animate-pulse">
              SYNCING HUNTER CODEX...
            </p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl bg-monarch-card/80 border border-dashed border-monarch-roseBorder/40 p-8 text-center space-y-2">
            <i className="fa-solid fa-magnifying-glass text-2xl text-monarch-crimson/50"></i>
            <h3 className="font-display text-sm font-bold text-monarch-textPrimary uppercase tracking-wider">
              No Blueprints Found
            </h3>
            <p className="text-xs text-monarch-textMuted">
              Adjust search keywords or reset filter matrix to query the Monarch library.
            </p>
          </div>
        ) : (
          exercises.map((exercise) => {
            const isSelected = activeCardId === exercise.id;
            const xpBounty = getXpBounty(exercise);
            const rankTier = getExerciseRank(exercise);
            const allocations = getStatAllocations(exercise);

            const displayCategory = (
              exercise.category ||
              (exercise.mechanic === 'compound' ? 'COMPOUND' : 'STRENGTH')
            ).toUpperCase();
            const displayMechanic = (
              exercise.mechanic ||
              (exercise.force ? exercise.force : 'DYNAMIC')
            ).toUpperCase();
            const displayForce = (exercise.force || 'DYNAMIC').toUpperCase();

            return (
              <article
                key={exercise.id}
                onClick={() => setActiveCardId(exercise.id)}
                className={`rounded-2xl p-3.5 relative overflow-hidden transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-monarch-cardElevated to-monarch-card border border-monarch-crimson shadow-crimson-glow pulse-border'
                    : 'bg-monarch-card border border-monarch-roseBorder/40 hover:border-monarch-crimson/70'
                }`}
              >
                {/* Watermark Insignia */}
                <div className="absolute -right-6 -bottom-6 w-28 h-28 border border-monarch-crimson/10 rounded-full pointer-events-none flex items-center justify-center">
                  <i className="fa-solid fa-shield-halved text-5xl text-monarch-crimson/5"></i>
                </div>

                {/* Top Title Row & XP Bounty */}
                <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase rounded bg-monarch-crimson text-white">
                        ID: EX-{String(exercise.id).padStart(3, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                        <i className="fa-solid fa-bolt text-[9px]"></i>+{xpBounty} XP
                      </span>
                    </div>
                    <h2 className="text-sm font-display font-black tracking-wide text-white mt-1">
                      {exercise.name}
                    </h2>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectExercise(exercise);
                    }}
                    className="text-monarch-crimson hover:text-white p-1 transition-colors"
                    title="Inspect Blueprint"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                  </button>
                </div>

                {/* Base Meta Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-monarch-crimson/40 text-[9px] font-mono font-bold text-rose-300 uppercase">
                    {exercise.muscle_group_display || exercise.muscle_group || 'BODYWEIGHT'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-monarch-surface border border-neutral-700/60 text-[9px] font-mono font-medium text-neutral-300 uppercase">
                    {exercise.equipment_display || exercise.equipment || 'NONE'}
                  </span>
                  <span className="px-1.5 py-0.5 text-[8px] font-mono text-amber-400/90 font-bold ml-auto">
                    {rankTier}
                  </span>
                </div>

                {/* 3 Columns: Category, Mechanic, Force */}
                <div className="p-2 rounded-xl bg-monarch-surface/90 border border-monarch-crimson/30 space-y-1 mb-2.5">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-monarch-crimson font-bold flex items-center justify-between">
                    <span>RULE ENGINE BLUEPRINT ATTRIBUTES</span>
                    <i className="fa-solid fa-gear text-[8px]"></i>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                    {/* Category */}
                    <div className="bg-monarch-card rounded-md py-1 px-1 border border-monarch-roseBorder/30">
                      <span className="block text-[7px] font-mono text-monarch-textMuted uppercase leading-none">
                        CATEGORY
                      </span>
                      <span className="block text-[9px] font-mono font-bold text-amber-300 uppercase mt-0.5 truncate">
                        {displayCategory}
                      </span>
                    </div>

                    {/* Mechanic */}
                    <div className="bg-monarch-card rounded-md py-1 px-1 border border-monarch-roseBorder/30">
                      <span className="block text-[7px] font-mono text-monarch-textMuted uppercase leading-none">
                        MECHANIC
                      </span>
                      <span className="block text-[9px] font-mono font-bold text-cyan-300 uppercase mt-0.5 truncate">
                        {displayMechanic}
                      </span>
                    </div>

                    {/* Force */}
                    <div className="bg-monarch-card rounded-md py-1 px-1 border border-monarch-roseBorder/30">
                      <span className="block text-[7px] font-mono text-monarch-textMuted uppercase leading-none">
                        FORCE
                      </span>
                      <span className="block text-[9px] font-mono font-bold text-rose-300 uppercase mt-0.5 truncate">
                        {displayForce}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat Allocation Multipliers & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-monarch-roseBorder/20 text-[9px] font-mono">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-monarch-textMuted font-bold shrink-0">STAT:</span>
                    {allocations.map((stat) => (
                      <span
                        key={stat.name}
                        className={`px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                          stat.color === 'emerald'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                            : stat.color === 'amber'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/40'
                            : stat.color === 'rose'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/40'
                            : stat.color === 'sky'
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800/40'
                            : 'bg-purple-950/80 text-purple-300 border-purple-800/40'
                        }`}
                      >
                        {stat.name} +{stat.val.toFixed(1)}x
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectExercise(exercise);
                      }}
                      className="text-rose-400 hover:text-white font-sans text-[10px] font-semibold flex items-center gap-0.5"
                    >
                      INSPECT <i className="fa-solid fa-angle-right text-[8px]"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/workout', { state: { initialExercise: exercise } });
                      }}
                      title="Add to Active Dungeon Run"
                      className="px-2 py-0.5 rounded bg-monarch-crimson hover:bg-rose-600 text-white font-mono text-[9px] font-bold uppercase transition-transform active:scale-95 shadow-crimson-glow"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* Floating Action: Quick Scroll Top or Create */}
      <div className="fixed bottom-20 right-4 max-w-md z-30 pointer-events-auto">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-700 via-monarch-crimson to-red-500 text-white flex items-center justify-center shadow-crimson-focus border border-rose-300/60 active:scale-95 transition-transform"
          title="Return to top"
        >
          <i className="fa-solid fa-arrow-up text-sm"></i>
        </button>
      </div>

      {/* Exercise Detail Inspection Modal */}
      {inspectExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectExercise(null);
          }}
        >
          <div className="w-full max-w-md bg-monarch-surface border border-monarch-crimson/80 rounded-2xl p-5 shadow-crimson-focus space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 text-[8px] font-mono font-black uppercase rounded bg-monarch-crimson text-white">
                    EX-{String(inspectExercise.id).padStart(3, '0')}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    <i className="fa-solid fa-bolt mr-0.5"></i>+{getXpBounty(inspectExercise)} XP
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-white">
                  {inspectExercise.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectExercise(null)}
                className="w-8 h-8 rounded-lg bg-monarch-card border border-monarch-roseBorder/40 flex items-center justify-center text-monarch-textMuted hover:text-white"
              >
                <i className="fa-solid fa-times text-sm"></i>
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-monarch-crimson/40 text-[10px] font-mono font-bold text-rose-300 uppercase">
                {inspectExercise.muscle_group_display || inspectExercise.muscle_group || 'PRIMARY'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-monarch-card border border-neutral-700/60 text-[10px] font-mono text-neutral-300 uppercase">
                {inspectExercise.equipment_display || inspectExercise.equipment || 'BODYWEIGHT'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/40 text-[10px] font-mono text-cyan-300 uppercase">
                {inspectExercise.mechanic || 'GENERAL'}
              </span>
            </div>

            {/* Target Muscles */}
            {(inspectExercise.primary_muscles?.length > 0 || inspectExercise.secondary_muscles?.length > 0) && (
              <div className="p-3 rounded-xl bg-monarch-card border border-monarch-roseBorder/30 space-y-1.5 text-xs">
                <div className="font-mono text-[9px] uppercase tracking-wider text-monarch-crimson font-bold">
                  MUSCLE RECRUITMENT PROFILE
                </div>
                {inspectExercise.primary_muscles?.length > 0 && (
                  <div className="text-monarch-textSecondary text-[11px]">
                    <strong className="text-white font-mono">Primary: </strong>
                    {inspectExercise.primary_muscles.join(', ')}
                  </div>
                )}
                {inspectExercise.secondary_muscles?.length > 0 && (
                  <div className="text-monarch-textMuted text-[10px]">
                    <strong className="text-neutral-400 font-mono">Secondary: </strong>
                    {inspectExercise.secondary_muscles.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Full 6-Stat Multiplier Grid */}
            <div className="p-3 rounded-xl bg-monarch-card border border-monarch-roseBorder/30 space-y-2">
              <div className="font-mono text-[9px] uppercase tracking-wider text-monarch-crimson font-bold flex items-center justify-between">
                <span>SYSTEM RPG MULTIPLIERS</span>
                <i className="fa-solid fa-chart-simple text-[9px]"></i>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">STR</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    +{Number(inspectExercise.stat_str || 0).toFixed(1)}x
                  </div>
                </div>
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">VIT</div>
                  <div className="text-xs font-mono font-bold text-rose-300">
                    +{Number(inspectExercise.stat_vit || 0).toFixed(1)}x
                  </div>
                </div>
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">AGI</div>
                  <div className="text-xs font-mono font-bold text-sky-300">
                    +{Number(inspectExercise.stat_agi || 0).toFixed(1)}x
                  </div>
                </div>
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">END</div>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    +{Number(inspectExercise.stat_end || 0).toFixed(1)}x
                  </div>
                </div>
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">FLX</div>
                  <div className="text-xs font-mono font-bold text-purple-300">
                    +{Number(inspectExercise.stat_flx || 0).toFixed(1)}x
                  </div>
                </div>
                <div className="p-1.5 rounded bg-monarch-surface border border-monarch-roseBorder/20">
                  <div className="text-[8px] font-mono text-monarch-textMuted">PER</div>
                  <div className="text-xs font-mono font-bold text-blue-300">
                    +{Number(inspectExercise.stat_per || 0).toFixed(1)}x
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-monarch-crimson font-bold">
                TACTICAL EXECUTION INSTRUCTIONS
              </div>
              {Array.isArray(inspectExercise.instructions) && inspectExercise.instructions.length > 0 ? (
                <ol className="space-y-1.5 text-xs text-monarch-textSecondary list-decimal list-inside leading-relaxed">
                  {inspectExercise.instructions.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : inspectExercise.description ? (
                <p className="text-xs text-monarch-textSecondary leading-relaxed">
                  {inspectExercise.description}
                </p>
              ) : (
                <p className="text-xs text-monarch-textMuted italic">
                  Standard form protocol applies. Focus on mind-muscle connection.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setInspectExercise(null)}
                className="flex-1 py-2 rounded-xl bg-monarch-card border border-monarch-roseBorder/40 text-xs font-mono font-semibold text-monarch-textSecondary hover:text-white"
              >
                CLOSE
              </button>
              <button
                onClick={() => {
                  setInspectExercise(null);
                  navigate('/workout', { state: { initialExercise: inspectExercise } });
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-monarch-crimson hover:from-rose-600 hover:to-red-500 text-white font-mono text-xs font-bold uppercase shadow-crimson-glow flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-dungeon text-xs"></i>
                DEPLOY TO SESSION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
