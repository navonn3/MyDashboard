/**
 * App Details Modal Component
 * Displays application details, notes, ideas, and allows editing
 */

import { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Save,
  ExternalLink,
  Github,
  Database,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import {
  getApplication,
  getApplicationStatus,
  updateApplication,
  getNotes,
  getAppIdeas,
  getPromptHistory,
} from '../services/api';
import type { Application, ApplicationStatusCheck, AppNote } from '../types';
import StatusBadge from './StatusBadge';
import NotesPanel from './NotesPanel';
import IdeasList from './IdeasList';
import PromptHistory from './PromptHistory';
import LoadingSpinner from './LoadingSpinner';
import { formatDate, getPlatformDisplayName } from '../utils/helpers';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'notes' | 'ideas' | 'history';

export default function AppDetailsModal() {
  const { closeAppDetails, selectedAppId, isRTL } = useUIStore();
  const { updateApplicationInStore, setAppIdeas, setPromptHistory, promptHistory } = useDataStore();

  const [app, setApp] = useState<Application | null>(null);
  const [status, setStatus] = useState<ApplicationStatusCheck | null>(null);
  const [notes, setNotes] = useState<AppNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch application data
  useEffect(() => {
    if (!selectedAppId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [appRes, statusRes, notesRes, ideasRes, historyRes] = await Promise.all([
          getApplication(selectedAppId!),
          getApplicationStatus(selectedAppId!),
          getNotes(selectedAppId!),
          getAppIdeas(selectedAppId!),
          getPromptHistory(selectedAppId!),
        ]);

        if (appRes.success && appRes.data) {
          setApp(appRes.data);
          setEditForm(appRes.data);
        }

        if (statusRes.success && statusRes.data) {
          setStatus(statusRes.data);
        }

        if (notesRes.success && notesRes.data) {
          setNotes(notesRes.data);
        }

        if (ideasRes.success && ideasRes.data) {
          setAppIdeas(selectedAppId!, ideasRes.data);
        }

        if (historyRes.success && historyRes.data) {
          setPromptHistory(selectedAppId!, historyRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch app data:', error);
        toast.error('Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedAppId, setAppIdeas, setPromptHistory]);

  const handleSave = async () => {
    if (!app) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        github_url: editForm.github_url,
        database_url: editForm.database_url,
        database_platform: editForm.database_platform,
        frontend_url: editForm.frontend_url,
        frontend_platform: editForm.frontend_platform,
        live_url: editForm.live_url,
        build_platform: editForm.build_platform,
        status: editForm.status,
      };
      const response = await updateApplication(app.id, updateData);
      if (response.success && response.data) {
        setApp(response.data);
        updateApplicationInStore(response.data);
        setIsEditing(false);
        toast.success(isRTL ? 'נשמר בהצלחה' : 'Saved successfully');
      } else {
        toast.error(response.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshStatus = async () => {
    if (!selectedAppId) return;

    const response = await getApplicationStatus(selectedAppId);
    if (response.success && response.data) {
      setStatus(response.data);
    }
  };

  const history = selectedAppId ? promptHistory[selectedAppId] || [] : [];

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={closeAppDetails}>
        <div className="modal-content w-full max-w-4xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner text={isRTL ? 'טוען...' : 'Loading...'} />
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="modal-overlay" onClick={closeAppDetails}>
        <div className="modal-content w-full max-w-4xl p-8" onClick={(e) => e.stopPropagation()}>
          <p className="text-center text-gray-500">Application not found</p>
          <button onClick={closeAppDetails} className="btn-primary mt-4 mx-auto block">
            Close
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; labelHe: string }[] = [
    { id: 'overview', label: 'Overview', labelHe: 'סקירה' },
    { id: 'notes', label: 'Notes', labelHe: 'הערות' },
    { id: 'ideas', label: 'Ideas & Prompts', labelHe: 'רעיונות ופרומפטים' },
    { id: 'history', label: 'History', labelHe: 'היסטוריה' },
  ];

  return (
    <div className="modal-overlay" onClick={closeAppDetails}>
      <div
        className="modal-content w-full max-w-4xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {app.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={app.status} size="sm" />
                {status && <StatusBadge status={status.live.status} showDot size="sm" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && activeTab === 'overview' && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isRTL ? 'עריכה' : 'Edit'}
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(app);
                  }}
                  className="btn-secondary"
                >
                  {isRTL ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? (isRTL ? 'שומר...' : 'Saving...') : isRTL ? 'שמור' : 'Save'}
                </button>
              </>
            )}
            <button onClick={closeAppDetails} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {isRTL ? tab.labelHe : tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="label">{isRTL ? 'תיאור' : 'Description'}</label>
                {isEditing ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input min-h-[100px]"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {app.description || (isRTL ? 'אין תיאור' : 'No description')}
                  </p>
                )}
              </div>

              {/* Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">GitHub</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.github_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                      className="input text-sm"
                      placeholder="https://github.com/..."
                    />
                  ) : app.github_url ? (
                    <a
                      href={app.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {app.github_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{isRTL ? 'לא מוגדר' : 'Not configured'}</span>
                  )}
                </div>

                {/* Database */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Database</span>
                    {app.database_platform && (
                      <span className="text-xs text-gray-400">
                        ({getPlatformDisplayName(app.database_platform)})
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.database_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, database_url: e.target.value })}
                      className="input text-sm"
                    />
                  ) : app.database_url ? (
                    <a
                      href={app.database_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {app.database_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{isRTL ? 'לא מוגדר' : 'Not configured'}</span>
                  )}
                </div>

                {/* Frontend Platform */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Frontend Platform</span>
                    {app.frontend_platform && (
                      <span className="text-xs text-gray-400">
                        ({getPlatformDisplayName(app.frontend_platform)})
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.frontend_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, frontend_url: e.target.value })}
                      className="input text-sm"
                    />
                  ) : app.frontend_url ? (
                    <a
                      href={app.frontend_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {app.frontend_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{isRTL ? 'לא מוגדר' : 'Not configured'}</span>
                  )}
                </div>

                {/* Live Site */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Live Site</span>
                    {status && (
                      <button
                        onClick={refreshStatus}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Refresh status"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.live_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, live_url: e.target.value })}
                      className="input text-sm"
                    />
                  ) : app.live_url ? (
                    <a
                      href={app.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {app.live_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{isRTL ? 'לא מוגדר' : 'Not configured'}</span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">{isRTL ? 'פלטפורמה' : 'Platform'}</span>
                  <p className="font-medium">{getPlatformDisplayName(app.build_platform)}</p>
                </div>
                <div>
                  <span className="text-gray-400">{isRTL ? 'סטטוס' : 'Status'}</span>
                  <p>
                    <StatusBadge status={app.status} size="sm" />
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">{isRTL ? 'נוצר' : 'Created'}</span>
                  <p className="font-medium">{formatDate(app.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-400">{isRTL ? 'עודכן' : 'Updated'}</span>
                  <p className="font-medium">{formatDate(app.updated_at)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && notes && (
            <NotesPanel appId={app.id} initialContent={notes.content} />
          )}

          {activeTab === 'ideas' && (
            <IdeasList appId={app.id} appName={app.name} />
          )}

          {activeTab === 'history' && (
            <PromptHistory appId={app.id} history={history} />
          )}
        </div>
      </div>
    </div>
  );
}
