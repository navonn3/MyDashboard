/**
 * Application Table Component
 * Displays applications in a responsive table with actions
 */

import { useState, useEffect } from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { getApplicationStatus, deleteApplication, updateApplication } from '../services/api';
import type { Application, ApplicationStatusCheck } from '../types';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, getPlatformDisplayName } from '../utils/helpers';
import toast from 'react-hot-toast';

interface ApplicationTableProps {
  applications: Application[];
  isLoading?: boolean;
  showHidden?: boolean;
}

// Helper to generate Codespace URL from GitHub URL
const getCodespaceUrl = (githubUrl?: string): string | undefined => {
  if (!githubUrl) return undefined;
  // Convert github.com/owner/repo to github.dev/owner/repo
  return githubUrl.replace('github.com', 'github.dev');
};

// Helper to generate Vercel deployments URL
const getVercelDeploymentsUrl = (vercelProjectUrl?: string): string | undefined => {
  if (vercelProjectUrl) {
    // If explicit project URL provided, add /deployments
    return vercelProjectUrl.endsWith('/deployments') ? vercelProjectUrl : `${vercelProjectUrl}/deployments`;
  }
  return undefined;
};

export default function ApplicationTable({ applications, isLoading, showHidden = false }: ApplicationTableProps) {
  const { openAppDetails, isRTL } = useUIStore();
  const { removeApplication, updateApplicationInStore } = useDataStore();
  const [statusCache, setStatusCache] = useState<Record<string, ApplicationStatusCheck>>({});
  const [loadingStatus, setLoadingStatus] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Filter hidden apps based on showHidden prop
  const visibleApps = showHidden ? applications : applications.filter(app => !app.hidden);

  // Fetch status for all applications on mount
  useEffect(() => {
    visibleApps.forEach((app) => {
      if (!statusCache[app.id] && !loadingStatus.has(app.id)) {
        fetchStatus(app.id);
      }
    });
  }, [visibleApps]);

  const fetchStatus = async (appId: string) => {
    setLoadingStatus((prev) => new Set(prev).add(appId));
    try {
      const response = await getApplicationStatus(appId);
      if (response.success && response.data) {
        setStatusCache((prev) => ({ ...prev, [appId]: response.data! }));
      }
    } catch {
      console.error('Failed to fetch status for app:', appId);
    } finally {
      setLoadingStatus((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  };

  const handleDelete = async (app: Application) => {
    const confirmed = window.confirm(
      isRTL
        ? `האם אתה בטוח שברצונך למחוק את "${app.name}"?`
        : `Are you sure you want to delete "${app.name}"?`
    );

    if (!confirmed) return;

    const response = await deleteApplication(app.id);
    if (response.success) {
      removeApplication(app.id);
      toast.success(isRTL ? 'האפליקציה נמחקה' : 'Application deleted');
    } else {
      toast.error(response.error || 'Failed to delete');
    }
  };

  const handleToggleHidden = async (app: Application) => {
    const response = await updateApplication(app.id, { hidden: !app.hidden });
    if (response.success && response.data) {
      updateApplicationInStore(response.data);
      toast.success(
        app.hidden
          ? (isRTL ? 'האפליקציה מוצגת' : 'Application shown')
          : (isRTL ? 'האפליקציה הוסתרה' : 'Application hidden')
      );
    }
  };

  const copyClaudeCommand = (appName: string) => {
    const command = 'npm install -g @anthropic-ai/claude-code && claude --dangerously-skip-permissions';
    navigator.clipboard.writeText(command);
    setCopiedCommand(appName);
    toast.success(isRTL ? 'הפקודה הועתקה!' : 'Command copied!');
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  // Emoji link button component
  const EmojiLinkButton = ({
    url,
    emoji,
    title,
    onClick
  }: {
    url?: string;
    emoji: string;
    title: string;
    onClick?: () => void;
  }) => {
    if (!url && !onClick) {
      return (
        <span
          className="text-lg opacity-30 cursor-not-allowed select-none"
          title={isRTL ? 'לא מוגדר' : 'Not configured'}
        >
          {emoji}
        </span>
      );
    }

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className="text-lg hover:scale-125 transition-transform cursor-pointer select-none"
          title={title}
        >
          {emoji}
        </button>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg hover:scale-125 transition-transform select-none"
        title={title}
      >
        {emoji}
      </a>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="py-2">{isRTL ? 'שם' : 'Name'}</th>
            <th className="text-center py-2">{isRTL ? 'קישורים' : 'Links'}</th>
            <th className="py-2">{isRTL ? 'פלטפורמה' : 'Platform'}</th>
            <th className="text-center py-2">{isRTL ? 'סטטוס' : 'Status'}</th>
            <th className="py-2">{isRTL ? 'עודכן' : 'Updated'}</th>
            <th className="text-center py-2">{isRTL ? 'פעולות' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {visibleApps.map((app) => {
            const status = statusCache[app.id];
            const isStatusLoading = loadingStatus.has(app.id);
            const codespaceUrl = app.codespace_url || getCodespaceUrl(app.github_url);
            const vercelDeploymentsUrl = getVercelDeploymentsUrl(app.vercel_project_url);

            return (
              <tr key={app.id} className={`${isLoading ? 'opacity-50' : ''} ${app.hidden ? 'opacity-60' : ''}`}>
                {/* Application Name - Compact */}
                <td className="py-2">
                  <button
                    onClick={() => openAppDetails(app.id)}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 text-start"
                  >
                    {app.name}
                  </button>
                </td>

                {/* Links with Emojis */}
                <td className="py-2">
                  <div className="flex items-center justify-center gap-2">
                    <EmojiLinkButton
                      url={app.github_url}
                      emoji="🐙"
                      title="GitHub"
                    />
                    <EmojiLinkButton
                      url={codespaceUrl}
                      emoji="💻"
                      title="Codespace"
                    />
                    <EmojiLinkButton
                      url={app.database_url}
                      emoji={app.database_platform === 'supabase' ? '⚡' : app.database_platform === 'firebase' ? '🔥' : '🗄️'}
                      title={app.database_platform ? getPlatformDisplayName(app.database_platform) : 'Database'}
                    />
                    <EmojiLinkButton
                      url={vercelDeploymentsUrl || app.frontend_url}
                      emoji={app.frontend_platform === 'vercel' ? '▲' : app.frontend_platform === 'netlify' ? '◆' : '🌐'}
                      title={`${app.frontend_platform ? getPlatformDisplayName(app.frontend_platform) : 'Frontend'}${vercelDeploymentsUrl ? ' Deployments' : ''}`}
                    />
                    <EmojiLinkButton
                      url={app.live_url}
                      emoji="🚀"
                      title={isRTL ? 'אתר חי' : 'Live Site'}
                    />
                    <EmojiLinkButton
                      emoji={copiedCommand === app.id ? '✅' : '📋'}
                      title={isRTL ? 'העתק פקודת Claude Code' : 'Copy Claude Code command'}
                      onClick={() => copyClaudeCommand(app.id)}
                    />
                  </div>
                </td>

                {/* Platform */}
                <td className="py-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getPlatformDisplayName(app.build_platform)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-2">
                  <div className="flex items-center justify-center gap-1">
                    {isStatusLoading ? (
                      <span className="skeleton w-12 h-4" />
                    ) : status ? (
                      <StatusBadge status={status.live.status} showDot size="sm" />
                    ) : (
                      <StatusBadge status="unknown" showDot size="sm" />
                    )}
                  </div>
                </td>

                {/* Updated */}
                <td className="py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(app.updated_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-2">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                        className="btn-icon p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === app.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-36 card py-1 z-50 animate-fade-in`}>
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye className="w-3 h-3" />
                              {isRTL ? 'צפה' : 'View'}
                            </button>
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <FileText className="w-3 h-3" />
                              {isRTL ? 'הערות' : 'Notes'}
                            </button>
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="w-3 h-3" />
                              {isRTL ? 'ערוך' : 'Edit'}
                            </button>
                            <button
                              onClick={() => {
                                handleToggleHidden(app);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              {app.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {app.hidden ? (isRTL ? 'הצג' : 'Show') : (isRTL ? 'הסתר' : 'Hide')}
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button
                              onClick={() => {
                                handleDelete(app);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              {isRTL ? 'מחק' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
