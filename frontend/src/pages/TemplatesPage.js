import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [exercises, setExercises] = useState([]);

  const [newName, setNewName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data.results || data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setShowCreate(true);
    try {
      const data = await api.getExercises({ page_size: 200 });
      setExercises(data.results || data);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  };

  const addExercise = (exercise) => {
    if (selectedExercises.find((e) => e.exercise === exercise.id)) return;
    setSelectedExercises([
      ...selectedExercises,
      { exercise: exercise.id, name: exercise.name, target_sets: 3, target_reps: 10, order: selectedExercises.length },
    ]);
  };

  const removeExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    setSelectedExercises(
      selectedExercises.map((ex, i) =>
        i === index ? { ...ex, [field]: parseInt(value) || 0 } : ex
      )
    );
  };

  const handleCreate = async () => {
    if (!newName.trim() || selectedExercises.length === 0) return;
    setCreating(true);
    try {
      await api.createTemplate({
        name: newName,
        template_exercises: selectedExercises.map((ex, idx) => ({
          exercise: ex.exercise,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          order: idx,
        })),
      });
      setShowCreate(false);
      setNewName('');
      setSelectedExercises([]);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to create template:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dungeon template?')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const startFromTemplate = async (template) => {
    try {
      const session = await api.startSession({
        name: template.name,
        template: template.id,
      });
      navigate('/workout', { state: { sessionId: session.id } });
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  return (
    <div className="space-y-panel-gap">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">bolt</span>
          <h1 className="font-label-system text-label-system text-primary-container tracking-widest uppercase">Dungeons</h1>
        </div>
        <button 
          className="monarch-btn px-4 py-2 rounded text-[10px] font-label-system uppercase tracking-widest flex items-center gap-1"
          onClick={openCreateModal}
        >
          <span className="material-symbols-outlined text-sm">add</span> Create
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center opacity-70 border-dashed border-2">
          <span className="material-symbols-outlined text-4xl mb-2">description</span>
          <div className="font-label-system text-[10px] uppercase tracking-widest text-on-surface-variant">No dungeon templates yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template, idx) => (
            <div key={template.id} className={`glass-panel p-4 rounded-xl flex justify-between items-center animate-in delay-${(idx % 4) * 100}`}>
              <div>
                <div className="font-body-main font-semibold text-primary">{template.name}</div>
                <div className="text-[10px] text-on-surface-variant mt-1 font-label-system tracking-wider uppercase">
                  {template.exercise_count} Exercises
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="bg-primary-container/20 text-primary-container hover:bg-primary hover:text-background p-2 rounded transition-colors"
                  onClick={() => startFromTemplate(template)}
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                </button>
                <button 
                  className="bg-surface-container border border-surface-variant text-on-surface-variant hover:text-error hover:border-error/50 p-2 rounded transition-colors"
                  onClick={() => handleDelete(template.id)}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-panel w-full max-w-md max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-primary-container/20">
              <h3 className="font-label-system text-primary tracking-widest uppercase">Create Dungeon Template</h3>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div>
                <label className="font-label-system text-[10px] text-on-surface-variant uppercase mb-1 block">Template Name</label>
                <input
                  className="hud-input w-full rounded p-3 font-body-main text-sm text-primary-fixed"
                  placeholder="e.g. S-Rank Strength Trial"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>

              {selectedExercises.length > 0 && (
                <div>
                  <label className="font-label-system text-[10px] text-on-surface-variant uppercase mb-2 block">Selected Exercises</label>
                  <div className="space-y-2">
                    {selectedExercises.map((ex, idx) => (
                      <div key={idx} className="bg-surface-container/50 p-2 rounded border border-surface-variant flex items-center gap-2">
                        <span className="font-body-main text-xs text-primary flex-1 truncate">{ex.name}</span>
                        <input
                          className="hud-input w-12 rounded p-1 text-center text-xs"
                          type="number"
                          value={ex.target_sets}
                          onChange={(e) => updateExercise(idx, 'target_sets', e.target.value)}
                        />
                        <span className="text-[10px] text-on-surface-variant">x</span>
                        <input
                          className="hud-input w-12 rounded p-1 text-center text-xs"
                          type="number"
                          value={ex.target_reps}
                          onChange={(e) => updateExercise(idx, 'target_reps', e.target.value)}
                        />
                        <button className="text-on-surface-variant hover:text-error transition-colors" onClick={() => removeExercise(idx)}>
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="font-label-system text-[10px] text-on-surface-variant uppercase mb-2 block">Available Exercises</label>
                <div className="max-h-48 overflow-y-auto border border-surface-variant rounded bg-surface-container-lowest/50">
                  {exercises.map((ex) => {
                    const isSelected = selectedExercises.find((s) => s.exercise === ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => addExercise(ex)}
                        className={`p-2 border-b border-surface-variant/50 text-xs transition-colors ${
                          isSelected ? 'text-on-surface-variant opacity-50' : 'text-on-surface cursor-pointer hover:bg-primary-container/10'
                        }`}
                      >
                        {ex.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-primary-container/20 flex gap-2">
              <button 
                className="flex-1 bg-surface-container text-on-surface hover:bg-surface-variant font-label-system text-[10px] uppercase tracking-wider py-3 rounded transition-colors"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 monarch-btn font-label-system text-[10px] uppercase tracking-wider py-3 rounded disabled:opacity-50"
                onClick={handleCreate}
                disabled={creating || !newName.trim() || selectedExercises.length === 0}
              >
                {creating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
