/**
 * Global Ideas Box Component
 * Section for new application ideas not tied to existing apps
 */

import { useState } from 'react';
import {
  Plus,
  Lightbulb,
  ArrowRight,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import {
  createGlobalIdea,
  updateGlobalIdea,
  deleteGlobalIdea,
  convertGlobalIdea,
} from '../services/api';
import type { GlobalIdea, GlobalIdeaComplexity, GlobalIdeaStatus } from '../types';
import StatusBadge from './StatusBadge';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { value: '', label: 'Not specified' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'railway', label: 'Railway' },
  { value: 'render', label: 'Render' },
  { value: 'custom', label: 'Custom' },
];

export default function GlobalIdeasBox() {
  const { isRTL, openAddAppWizard } = useUIStore();
  const { globalIdeas, addGlobalIdea, updateGlobalIdeaInStore, removeGlobalIdea } = useDataStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  // New idea form
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    target_platform: '',
    complexity: 'medium' as GlobalIdeaComplexity,
  });

  // Edit form
  const [editForm, setEditForm] = useState<Partial<GlobalIdea>>({});

  const handleAddIdea = async () => {
    if (!newIdea.title.trim()) {
      toast.error(isRTL ? 'נדרשת כותרת' : 'Title is required');
      return;
    }

    const response = await createGlobalIdea({
      title: newIdea.title,
      description: newIdea.description,
      target_platform: newIdea.target_platform || undefined,
      complexity: newIdea.complexity,
    });

    if (response.success && response.data) {
      addGlobalIdea(response.data);
      setNewIdea({ title: '', description: '', target_platform: '', complexity: 'medium' });
      setIsAddingNew(false);
      toast.success(isRTL ? 'הרעיון נוסף' : 'Idea added');
    } else {
      toast.error(response.error || 'Failed to add idea');
    }
  };

  const handleUpdateIdea = async (id: string) => {
    const response = await updateGlobalIdea(id, editForm);

    if (response.success && response.data) {
      updateGlobalIdeaInStore(response.data);
      setEditingId(null);
      toast.success(isRTL ? 'הרעיון עודכן' : 'Idea updated');
    } else {
      toast.error(response.error || 'Failed to update');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    const confirmed = window.confirm(
      isRTL ? 'האם למחוק את הרעיון הזה?' : 'Delete this idea?'
    );
    if (!confirmed) return;

    const response = await deleteGlobalIdea(id);
    if (response.success) {
      removeGlobalIdea(id);
      toast.success(isRTL ? 'הרעיון נמחק' : 'Idea deleted');
    } else {
      toast.error(response.error || 'Failed to delete');
    }
  };

  const handleConvertToApp = async (idea: GlobalIdea) => {
    const response = await convertGlobalIdea(idea.id);

    if (response.success && response.data) {
      // Store the global idea ID so we can mark it as converted after app creation
      useUIStore.setState({ convertingGlobalIdeaId: idea.id });
      // Open wizard with prefilled data
      openAddAppWizard(response.data.prefill as any);
    } else {
      toast.error(response.error || 'Failed to convert');
    }
  };

  const activeIdeas = globalIdeas.filter((i) => i.status !== 'converted');
  const convertedIdeas = globalIdeas.filter((i) => i.status === 'converted');

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isRTL ? 'רעיונות לאפליקציות חדשות' : 'New App Ideas'}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </h2>
            <p className="text-sm text-gray-500">
              {activeIdeas.length} {isRTL ? 'רעיונות פעילים' : 'active ideas'}
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setIsExpanded(true);
            setIsAddingNew(true);
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'רעיון חדש' : 'New Idea'}
        </button>
      </div>

      {isExpanded && (
        <div className="card p-6 animate-slide-up">
          {/* New Idea Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <input
                type="text"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                className="input"
                placeholder={isRTL ? 'שם האפליקציה / הרעיון...' : 'App name / idea title...'}
                autoFocus
              />
              <textarea
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                className="input min-h-[80px]"
                placeholder={isRTL ? 'תיאור הרעיון...' : 'Describe your idea...'}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{isRTL ? 'פלטפורמה יעד' : 'Target Platform'}</label>
                  <select
                    value={newIdea.target_platform}
                    onChange={(e) => setNewIdea({ ...newIdea, target_platform: e.target.value })}
                    className="select"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{isRTL ? 'מורכבות' : 'Complexity'}</label>
                  <select
                    value={newIdea.complexity}
                    onChange={(e) =>
                      setNewIdea({ ...newIdea, complexity: e.target.value as GlobalIdeaComplexity })
                    }
                    className="select"
                  >
                    <option value="simple">{isRTL ? 'פשוט' : 'Simple'}</option>
                    <option value="medium">{isRTL ? 'בינוני' : 'Medium'}</option>
                    <option value="complex">{isRTL ? 'מורכב' : 'Complex'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAddingNew(false)} className="btn-secondary">
                  {isRTL ? 'ביטול' : 'Cancel'}
                </button>
                <button onClick={handleAddIdea} className="btn-primary">
                  {isRTL ? 'הוסף רעיון' : 'Add Idea'}
                </button>
              </div>
            </div>
          )}

          {/* Ideas List */}
          {activeIdeas.length === 0 && !isAddingNew ? (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{isRTL ? 'אין רעיונות לאפליקציות חדשות' : 'No new app ideas yet'}</p>
              <p className="text-sm mt-1">
                {isRTL
                  ? 'הוסף רעיונות שאפשר להפוך לאפליקציות בעתיד'
                  : 'Add ideas that can be converted to apps later'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIdeas.map((idea) => (
                <div key={idea.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {editingId === idea.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="input"
                      />
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="input min-h-[60px]"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <select
                            value={editForm.complexity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, complexity: e.target.value as GlobalIdeaComplexity })
                            }
                            className="select w-28"
                          >
                            <option value="simple">{isRTL ? 'פשוט' : 'Simple'}</option>
                            <option value="medium">{isRTL ? 'בינוני' : 'Medium'}</option>
                            <option value="complex">{isRTL ? 'מורכב' : 'Complex'}</option>
                          </select>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({ ...editForm, status: e.target.value as GlobalIdeaStatus })
                            }
                            className="select w-32"
                          >
                            <option value="idea">{isRTL ? 'רעיון' : 'Idea'}</option>
                            <option value="planning">{isRTL ? 'תכנון' : 'Planning'}</option>
                            <option value="started">{isRTL ? 'התחיל' : 'Started'}</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)} className="btn-icon">
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateIdea(idea.id)}
                            className="btn-icon text-primary-600"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {idea.title}
                            </h4>
                            <StatusBadge status={idea.complexity} size="sm" />
                            <StatusBadge status={idea.status} size="sm" />
                          </div>
                          {idea.description && expandedIdeaId === idea.id && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {idea.description}
                            </p>
                          )}
                          {idea.target_platform && (
                            <span className="text-xs text-gray-400 mt-1 inline-block">
                              {isRTL ? 'פלטפורמה:' : 'Platform:'} {idea.target_platform}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {idea.description && (
                            <button
                              onClick={() =>
                                setExpandedIdeaId(expandedIdeaId === idea.id ? null : idea.id)
                              }
                              className="btn-icon"
                            >
                              {expandedIdeaId === idea.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditForm(idea);
                              setEditingId(idea.id);
                            }}
                            className="btn-icon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="btn-icon text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(idea.created_at)}
                        </span>
                        <button
                          onClick={() => handleConvertToApp(idea)}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          {isRTL ? 'הפוך לאפליקציה' : 'Convert to App'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Converted Ideas (collapsed) */}
          {convertedIdeas.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-400 mb-2">
                {convertedIdeas.length} {isRTL ? 'רעיונות שהומרו' : 'converted ideas'}
              </p>
              <div className="flex flex-wrap gap-2">
                {convertedIdeas.map((idea) => (
                  <span
                    key={idea.id}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"
                  >
                    {idea.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
