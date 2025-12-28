/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

import type { IdeaPriority, IdeaStatus, GlobalIdeaStatus, GlobalIdeaComplexity, PlatformStatus } from '../types';

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, locale = 'en-US'): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return formatDate(dateString);
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return dateString;
  }
}

/**
 * Get color classes for priority badges
 */
export function getPriorityColor(priority: IdeaPriority): string {
  switch (priority) {
    case 'high':
      return 'badge-error';
    case 'medium':
      return 'badge-warning';
    case 'low':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

/**
 * Get color classes for status badges
 */
export function getStatusColor(status: IdeaStatus | GlobalIdeaStatus): string {
  switch (status) {
    case 'completed':
    case 'converted':
      return 'badge-success';
    case 'in_progress':
    case 'started':
      return 'badge-primary';
    case 'pending':
    case 'idea':
    case 'planning':
      return 'badge-warning';
    case 'cancelled':
      return 'badge-error';
    default:
      return 'badge-gray';
  }
}

/**
 * Get color classes for complexity badges
 */
export function getComplexityColor(complexity: GlobalIdeaComplexity): string {
  switch (complexity) {
    case 'complex':
      return 'badge-error';
    case 'medium':
      return 'badge-warning';
    case 'simple':
      return 'badge-success';
    default:
      return 'badge-gray';
  }
}

/**
 * Get color classes for platform status
 */
export function getPlatformStatusColor(status: PlatformStatus): string {
  switch (status) {
    case 'online':
      return 'badge-success';
    case 'building':
      return 'badge-warning';
    case 'offline':
    case 'error':
      return 'badge-error';
    case 'unknown':
    default:
      return 'badge-gray';
  }
}

/**
 * Get human-readable label for status
 */
export function getStatusLabel(status: IdeaStatus | GlobalIdeaStatus): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    idea: 'Idea',
    planning: 'Planning',
    started: 'Started',
    converted: 'Converted',
  };
  return labels[status] || status;
}

/**
 * Get Hebrew label for status
 */
export function getStatusLabelHe(status: IdeaStatus | GlobalIdeaStatus): string {
  const labels: Record<string, string> = {
    pending: 'ממתין',
    in_progress: 'בתהליך',
    completed: 'הושלם',
    cancelled: 'בוטל',
    idea: 'רעיון',
    planning: 'תכנון',
    started: 'התחיל',
    converted: 'הומר',
  };
  return labels[status] || status;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Download data as JSON file
 */
export function downloadAsJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    vibe_coding: 'Vibe Coding',
    vercel: 'Vercel',
    netlify: 'Netlify',
    railway: 'Railway',
    render: 'Render',
    custom: 'Custom',
    supabase: 'Supabase',
    firebase: 'Firebase',
    planetscale: 'PlanetScale',
  };
  return names[platform] || platform;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (optional)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Class name helper (clsx alternative)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
