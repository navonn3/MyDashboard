/**
 * Status Badge Component
 * Displays status indicators with appropriate colors
 */

import { cn } from '../utils/helpers';
import type { PlatformStatus, IdeaStatus, IdeaPriority, GlobalIdeaStatus, GlobalIdeaComplexity } from '../types';

interface StatusBadgeProps {
  status: PlatformStatus | IdeaStatus | GlobalIdeaStatus | IdeaPriority | GlobalIdeaComplexity | string;
  type?: 'platform' | 'idea' | 'priority' | 'complexity' | 'globalIdea';
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIGS: Record<string, { bg: string; text: string; dot?: string }> = {
  // Platform status
  online: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  offline: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  building: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  unknown: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },

  // Idea status
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },

  // Global idea status
  idea: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  planning: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  started: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  converted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },

  // Priority
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },

  // Complexity
  simple: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  complex: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },

  // App status
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  archived: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
  maintenance: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
};

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  building: 'Building',
  error: 'Error',
  unknown: 'Unknown',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  idea: 'Idea',
  planning: 'Planning',
  started: 'Started',
  converted: 'Converted',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  simple: 'Simple',
  complex: 'Complex',
  active: 'Active',
  archived: 'Archived',
  maintenance: 'Maintenance',
};

export default function StatusBadge({
  status,
  size = 'md',
  showDot = false,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.unknown;
  const label = STATUS_LABELS[status] || status;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.text,
        sizeClasses[size],
        className
      )}
    >
      {showDot && config.dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      )}
      {label}
    </span>
  );
}
