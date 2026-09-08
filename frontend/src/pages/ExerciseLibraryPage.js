import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MUSCLE_GROUPS = [
  { value: '', label: 'All' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'legs', label: 'Legs' },
  { value: 'arms', label: 'Arms' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
];

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (muscleGroup) params.muscle_group = muscleGroup;
        const data = await api.getExercises(params);
        setExercises(data.results || data);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchExercises, 300);
    return () => clearTimeout(debounce);
  }, [search, muscleGroup]);

  return (
    <div className="space-y-panel-gap">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary-container">fitness_center</span>
        <h1 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">Exercise Library</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
        <input
          type="text"
          placeholder="Search exercises..."
          className="hud-input w-full bg-surface-container/50 rounded-lg pl-10 pr-4 py-3 font-body-main text-sm text-primary-fixed placeholder:text-on-surface-variant focus:ring-0 focus:border-monarch-crimson transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Muscle Group Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg.value}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-system text-[10px] uppercase tracking-wider transition-colors ${
              muscleGroup === mg.value 
                ? 'bg-primary text-background' 
                : 'bg-surface-container border border-surface-variant text-on-surface-variant hover:text-primary hover:border-primary/50'
            }`}
            onClick={() => setMuscleGroup(mg.value)}
          >
            {mg.label}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : exercises.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center opacity-70 border-dashed border-2">
          <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
          <div className="font-label-system text-[10px] uppercase tracking-widest text-on-surface-variant">No exercises found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exercises.map((exercise, idx) => (
            <div
              key={exercise.id}
              className={`glass-panel p-4 rounded-xl animate-in delay-${(idx % 4) * 100}`}
            >
              <div className="font-body-main font-semibold text-primary mb-2">{exercise.name}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-[9px] bg-primary-container/20 text-primary-container px-2 py-1 rounded font-label-system tracking-wider uppercase">
                  {exercise.muscle_group_display}
                </span>
                <span className="text-[9px] bg-surface-container-high border border-surface-variant text-on-surface-variant px-2 py-1 rounded font-label-system tracking-wider uppercase">
                  {exercise.equipment_display}
                </span>
                <span className="text-[9px] bg-tertiary/20 text-tertiary px-2 py-1 rounded font-label-system tracking-wider uppercase ml-auto">
                  {exercise.default_stat}
                </span>
              </div>
              {exercise.description && (
                <p className="text-xs text-on-surface-variant line-clamp-2">
                  {exercise.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
