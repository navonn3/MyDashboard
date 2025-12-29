/**
 * Deployment Status Panel Component
 * Shows live deployment status for Vercel projects
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

interface DeploymentInfo {
  id: string;
  appId: string;
  appName: string;
  platform: string;
  status: 'building' | 'ready' | 'error' | 'queued' | 'canceled' | 'unknown';
  url?: string;
  createdAt?: string;
  duration?: number;
}

export default function DeploymentStatusPanel() {
  const { isRTL } = useUIStore();
  const { applications } = useDataStore();
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Get apps with Vercel URLs
  const vercelApps = applications.filter(
    app => app.vercel_project_url || (app.frontend_platform === 'vercel' && app.frontend_url)
  );

  // Check deployment status (simulated - would need real API integration)
  const checkDeployments = useCallback(async () => {
    if (vercelApps.length === 0) return;

    setIsLoading(true);
    try {
      // Simulate checking deployment status
      // In real implementation, this would call Vercel API
      const mockDeployments: DeploymentInfo[] = vercelApps.map(app => ({
        id: `deploy-${app.id}`,
        appId: app.id,
        appName: app.name,
        platform: 'vercel',
        status: 'ready' as const, // Would be real status from API
        url: app.live_url,
        createdAt: new Date().toISOString(),
      }));

      setDeployments(mockDeployments);
      setLastRefresh(new Date());
    } catch (error) {
      toast.error(isRTL ? 'שגיאה בבדיקת סטטוס' : 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  }, [vercelApps, isRTL]);

  // Initial check
  useEffect(() => {
    checkDeployments();
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(checkDeployments, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, checkDeployments]);

  const getStatusIcon = (status: DeploymentInfo['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'building':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error':
      case 'canceled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: DeploymentInfo['status']) => {
    const texts = {
      ready: isRTL ? 'מוכן' : 'Ready',
      building: isRTL ? 'בבנייה...' : 'Building...',
      queued: isRTL ? 'בתור' : 'Queued',
      error: isRTL ? 'שגיאה' : 'Error',
      canceled: isRTL ? 'בוטל' : 'Canceled',
      unknown: isRTL ? 'לא ידוע' : 'Unknown',
    };
    return texts[status];
  };

  if (vercelApps.length === 0) {
    return null;
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {isRTL ? 'סטטוס Deployments' : 'Deployment Status'}
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            {isRTL ? 'רענון אוטומטי' : 'Auto-refresh'}
          </label>
          <button
            onClick={checkDeployments}
            disabled={isLoading}
            className="btn-icon"
            title={isRTL ? 'רענן' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {lastRefresh && (
        <p className="text-xs text-gray-400 mb-3">
          {isRTL ? 'עודכן לאחרונה:' : 'Last checked:'} {lastRefresh.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-2">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(deployment.status)}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {deployment.appName}
                </p>
                <p className="text-xs text-gray-500">
                  {getStatusText(deployment.status)}
                </p>
              </div>
            </div>

            {deployment.url && (
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        {isRTL
          ? 'טיפ: לסנכרון אמיתי עם Vercel, הוסף את ה-API Token בהגדרות'
          : 'Tip: For real Vercel sync, add your API Token in Settings'}
      </p>
    </div>
  );
}
