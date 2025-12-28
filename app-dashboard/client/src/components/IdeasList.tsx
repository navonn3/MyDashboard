/**
 * Ideas List Component
 * Displays and manages feature ideas for an application
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { createAppIdea, updateAppIdea, deleteAppIdea, generatePrompt } from '../services/api';
import type { AppIdea, IdeaPriority, IdeaStatus } from '../types';
import StatusBadge from './StatusBadge';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

interface IdeasListProps {
  appId: string;
  ideas: AppIdea[];
}

export default function IdeasList({ appId, ideas }: IdeasListProps) {
  const { isRTL, openPromptModal } = useUIStore();
  const { addAppIdea, updateAppIdea: updateIdeaInStore, removeAppIdea, addPromptToHistory } = useDataStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedForPrompt, setSelectedForPrompt] = useState<Set<string>>(new Set());

  // New idea form
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    priority: 'medium' as IdeaPriority,
  });

  // Edit form
  const [editForm, setEditForm] = useState<Partial<AppIdea>>({});

  const handleAddIdea = async () => {
    if (!newIdea.title.trim()) {
      toast.error(isRTL ? 'נדרשת כותרת' : 'Title is required');
      return;
    }

    const response = await createAppIdea(appId, {
      title: newIdea.title,
      description: newIdea.description,
      priority: newIdea.priority,
    });

    if (response.success && response.data) {
      addAppIdea(appId, response.data);
      setNewIdea({ title: '', description: '', priority: 'medium' });
      setIsAddingNew(false);
      toast.success(isRTL ? 'הרעיון נוסף' : 'Idea added');
    } else {
      toast.error(response.error || 'Failed to add idea');
    }
  };

  const handleUpdateIdea = async (id: string) => {
    const response = await updateAppIdea(id, editForm);

    if (response.success && response.data) {
      updateIdeaInStore(appId, response.data);
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

    const response = await deleteAppIdea(id);
    if (response.success) {
      removeAppIdea(appId, id);
      toast.success(isRTL ? 'הרעיון נמחק' : 'Idea deleted');
    } else {
      toast.error(response.error || 'Failed to delete');
    }
  };

  const handleStatusChange = async (idea: AppIdea, newStatus: IdeaStatus) => {
    const response = await updateAppIdea(idea.id, { status: newStatus });
    if (response.success && response.data) {
      updateIdeaInStore(appId, response.data);
    }
  };

  const handleGeneratePrompt = async () => {
    const ideaIds = selectedForPrompt.size > 0
      ? Array.from(selectedForPrompt)
      : undefined;

    setIsGenerating(true);
    try {
      const response = await generatePrompt(appId, ideaIds);

      if (response.success && response.data) {
        openPromptModal(response.data.prompt);
        addPromptToHistory(appId, {
          id: response.data.id,
          app_id: appId,
          ideas_snapshot: ideas.filter(i => !ideaIds || ideaIds.includes(i.id)),
          generated_prompt: response.data.prompt,
          created_at: response.data.created_at,
        });
        toast.success(isRTL ? 'הפרומפט נוצר בהצלחה' : 'Prompt generated successfully');
      } else {
        toast.error(response.error || 'Failed to generate prompt');
      }
    } catch (error) {
      toast.error(isRTL ? 'שגיאה ביצירת הפרומפט' : 'Error generating prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIdeaSelection = (id: string) => {
    setSelectedForPrompt(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const pendingIdeas = ideas.filter(i => i.status === 'pending' || i.status === 'in_progress');

  return (
    <div className="space-y-4">
      {/* Header with Generate Prompt Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'רעיונות לפיתוח' : 'Feature Ideas'}
          </h3>
          <p className="text-sm text-gray-500">
            {pendingIdeas.length} {isRTL ? 'רעיונות בהמתנה' : 'pending ideas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Prompt Button */}
          {ideas.length > 0 && (
            <button
              onClick={handleGeneratePrompt}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2"
              title={isRTL ? 'צור פרומפט למימוש' : 'Generate Implementation Prompt'}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  {isRTL ? 'מייצר...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isRTL ? 'צור פרומפט למימוש' : 'Generate Prompt'}
                </>
              )}
            </button>
          )}

          {/* Add New Button */}
          <button
            onClick={() => setIsAddingNew(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'רעיון חדש' : 'New Idea'}
          </button>
        </div>
      </div>

      {/* Selection hint */}
      {ideas.length > 0 && (
        <p className="text-xs text-gray-400">
          {isRTL
            ? 'לחץ על רעיונות כדי לבחור אילו לכלול בפרומפט, או השאר ריק לכל הרעיונות הפעילים'
            : 'Click ideas to select which to include in prompt, or leave empty for all active ideas'}
          {selectedForPrompt.size > 0 && (
            <span className="text-primary-600 ml-2">
              ({selectedForPrompt.size} {isRTL ? 'נבחרו' : 'selected'})
            </span>
          )}
        </p>
      )}

      {/* New Idea Form */}
      {isAddingNew && (
        <div className="card p-4 space-y-3 animate-slide-up">
          <input
            type="text"
            value={newIdea.title}
            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
            className="input"
            placeholder={isRTL ? 'כותרת הרעיון...' : 'Idea title...'}
            autoFocus
          />
          <textarea
            value={newIdea.description}
            onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
            className="input min-h-[80px]"
            placeholder={isRTL ? 'תיאור (אופציונלי)...' : 'Description (optional)...'}
          />
          <div className="flex items-center justify-between">
            <select
              value={newIdea.priority}
              onChange={(e) => setNewIdea({ ...newIdea, priority: e.target.value as IdeaPriority })}
              className="select w-32"
            >
              <option value="low">{isRTL ? 'נמוך' : 'Low'}</option>
              <option value="medium">{isRTL ? 'בינוני' : 'Medium'}</option>
              <option value="high">{isRTL ? 'גבוה' : 'High'}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingNew(false)}
                className="btn-secondary"
              >
                {isRTL ? 'ביטול' : 'Cancel'}
              </button>
              <button onClick={handleAddIdea} className="btn-primary">
                {isRTL ? 'הוסף' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{isRTL ? 'אין רעיונות עדיין' : 'No ideas yet'}</p>
          <p className="text-sm mt-1">
            {isRTL ? 'הוסף רעיונות לפיצ\'רים חדשים' : 'Add feature ideas to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className={`card p-4 transition-all cursor-pointer ${
                selectedForPrompt.has(idea.id)
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : ''
              }`}
              onClick={() => toggleIdeaSelection(idea.id)}
            >
              {editingId === idea.id ? (
                // Edit Mode
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
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
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as IdeaPriority })}
                        className="select w-28"
                      >
                        <option value="low">{isRTL ? 'נמוך' : 'Low'}</option>
                        <option value="medium">{isRTL ? 'בינוני' : 'Medium'}</option>
                        <option value="high">{isRTL ? 'גבוה' : 'High'}</option>
                      </select>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as IdeaStatus })}
                        className="select w-32"
                      >
                        <option value="pending">{isRTL ? 'ממתין' : 'Pending'}</option>
                        <option value="in_progress">{isRTL ? 'בתהליך' : 'In Progress'}</option>
                        <option value="completed">{isRTL ? 'הושלם' : 'Completed'}</option>
                        <option value="cancelled">{isRTL ? 'בוטל' : 'Cancelled'}</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-icon"
                      >
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
                        <StatusBadge status={idea.priority} size="sm" />
                        <StatusBadge status={idea.status} size="sm" />
                      </div>
                      {idea.description && expandedId === idea.id && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {idea.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {idea.description && (
                        <button
                          onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                          className="btn-icon"
                        >
                          {expandedId === idea.id ? (
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

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{formatRelativeTime(idea.created_at)}</span>
                    {idea.completed_at && (
                      <span>
                        {isRTL ? 'הושלם:' : 'Completed:'} {formatRelativeTime(idea.completed_at)}
                      </span>
                    )}
                  </div>

                  {/* Quick status buttons */}
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    {idea.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(idea, 'completed')}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                      >
                        {isRTL ? 'סמן כהושלם' : 'Mark Complete'}
                      </button>
                    )}
                    {idea.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(idea, 'in_progress')}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200"
                      >
                        {isRTL ? 'התחל עבודה' : 'Start Working'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
