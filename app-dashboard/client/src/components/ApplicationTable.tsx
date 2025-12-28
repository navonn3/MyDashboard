/**
 * Application Table Component
 * Displays applications in a responsive table with actions
 */

import { useState, useEffect } from 'react';
import {
  Github,
  Database,
  Globe,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Eye,
} from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { getApplicationStatus, deleteApplication } from '../services/api';
import type { Application, ApplicationStatusCheck } from '../types';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, getPlatformDisplayName, truncateText } from '../utils/helpers';
import toast from 'react-hot-toast';

interface ApplicationTableProps {
  applications: Application[];
  isLoading?: boolean;
}

export default function ApplicationTable({ applications, isLoading }: ApplicationTableProps) {
  const { openAppDetails, isRTL } = useUIStore();
  const { removeApplication } = useDataStore();
  const [statusCache, setStatusCache] = useState<Record<string, ApplicationStatusCheck>>({});
  const [loadingStatus, setLoadingStatus] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch status for all applications on mount
  useEffect(() => {
    applications.forEach((app) => {
      if (!statusCache[app.id] && !loadingStatus.has(app.id)) {
        fetchStatus(app.id);
      }
    });
  }, [applications]);

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

  const LinkButton = ({ url, icon: Icon, title }: { url?: string; icon: typeof Github; title: string }) => {
    if (!url) {
      return (
        <span className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="Not configured">
          <Icon className="w-4 h-4" />
        </span>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
        title={title}
      >
        <Icon className="w-4 h-4" />
      </a>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>{isRTL ? 'שם האפליקציה' : 'Application Name'}</th>
            <th className="text-center">{isRTL ? 'קישורים' : 'Links'}</th>
            <th>{isRTL ? 'פלטפורמה' : 'Platform'}</th>
            <th className="text-center">{isRTL ? 'סטטוס' : 'Status'}</th>
            <th>{isRTL ? 'עודכן' : 'Updated'}</th>
            <th className="text-center">{isRTL ? 'פעולות' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const status = statusCache[app.id];
            const isStatusLoading = loadingStatus.has(app.id);

            return (
              <tr key={app.id} className={isLoading ? 'opacity-50' : ''}>
                {/* Application Name */}
                <td>
                  <div className="flex flex-col">
                    <button
                      onClick={() => openAppDetails(app.id)}
                      className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 text-left"
                    >
                      {app.name}
                    </button>
                    {app.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {truncateText(app.description, 50)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Links */}
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <LinkButton url={app.github_url} icon={Github} title="GitHub" />
                    <LinkButton url={app.database_url} icon={Database} title="Database" />
                    <LinkButton url={app.frontend_url} icon={Globe} title="Frontend Platform" />
                    <LinkButton url={app.live_url} icon={ExternalLink} title="Live Site" />
                  </div>
                </td>

                {/* Platform */}
                <td>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getPlatformDisplayName(app.build_platform)}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <div className="flex items-center justify-center gap-2">
                    {isStatusLoading ? (
                      <span className="skeleton w-16 h-5" />
                    ) : status ? (
                      <StatusBadge status={status.live.status} showDot size="sm" />
                    ) : (
                      <StatusBadge status="unknown" showDot size="sm" />
                    )}
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                </td>

                {/* Updated */}
                <td>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(app.updated_at)}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                        className="btn-icon"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === app.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 card py-1 z-50 animate-fade-in">
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {isRTL ? 'צפה' : 'View Details'}
                            </button>
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              {isRTL ? 'הערות ורעיונות' : 'Notes & Ideas'}
                            </button>
                            <button
                              onClick={() => {
                                openAppDetails(app.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              {isRTL ? 'ערוך' : 'Edit'}
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button
                              onClick={() => {
                                handleDelete(app);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
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
