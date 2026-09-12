import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`;
  }
  return `${secs}s`;
}

export function formatDateRelative(date: Date | string | null | undefined): string {
  if (!date) return 'No date';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  if (isToday(d)) {
    return 'Today';
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  return format(d, 'd MMM yyyy');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return format(d, 'd MMM, HH:mm');
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400 animate-pulse',
      };
    case 'WAITING_FOR_UPDATE':
      return {
        label: 'Waiting for Update',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'BLOCKED':
      return {
        label: 'Blocked',
        color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400 animate-ping',
      };
    case 'COMPLETED':
    case 'RESOLVED':
    case 'RELEASED':
      return {
        label: 'Completed',
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'QA':
    case 'Ready for QA':
      return {
        label: 'QA Testing',
        color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'Not Started',
        color: 'bg-slate-800 text-slate-400 border-slate-700',
        dot: 'bg-slate-500',
      };
  }
}

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: '🔴',
      };
    case 'HIGH':
      return {
        label: 'High',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: '🟠',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: '🔵',
      };
    case 'LOW':
    default:
      return {
        label: 'Low',
        color: 'bg-slate-500/20 text-slate-300 border-slate-600/40',
        icon: '⚪',
      };
  }
}

export function getEnvironmentBadge(env: string | null | undefined) {
  switch (env) {
    case 'PROD':
      return {
        label: 'PROD',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    case 'QA':
      return {
        label: 'QA',
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      };
    case 'DEV':
    default:
      return {
        label: 'DEV',
        color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      };
  }
}

export const PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export function sortByPriority<
  T extends { priority?: string | null; createdAt?: Date | string | null; dueDate?: Date | string | null }
>(items: T[]): T[] {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority?.toUpperCase() || ''] ?? 99;
    const weightB = PRIORITY_WEIGHTS[b.priority?.toUpperCase() || ''] ?? 99;

    if (weightA !== weightB) {
      return weightA - weightB; // CRITICAL (1) -> HIGH (2) -> MEDIUM (3) -> LOW (4)
    }

    // Secondary sort: Due date ascending (soonest first)
    if (a.dueDate && b.dueDate) {
      const diffDue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (diffDue !== 0) return diffDue;
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    // Tertiary sort: Creation date descending (newest first)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

