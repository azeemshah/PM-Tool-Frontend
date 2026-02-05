import type { GanttBarColors } from '../types/gantt';

export const statusColorMap: GanttBarColors = {
  'To Do': {
    bgColor: 'bg-blue-200 dark:bg-blue-900',
    borderColor: 'border-blue-400 dark:border-blue-700',
    textColor: 'text-blue-900 dark:text-blue-100',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    progressBg: 'bg-blue-300 dark:bg-blue-700',
    progressText: 'text-blue-700 dark:text-blue-200',
  },
  'In Progress': {
    bgColor: 'bg-yellow-500 dark:bg-yellow-600',
    borderColor: 'border-yellow-600 dark:border-yellow-700',
    textColor: 'text-white dark:text-white',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    progressBg: 'bg-yellow-300 dark:bg-yellow-700',
    progressText: 'text-yellow-800 dark:text-yellow-200',
  },
  'Done': {
    bgColor: 'bg-green-500 dark:bg-green-600',
    borderColor: 'border-green-600 dark:border-green-700',
    textColor: 'text-white dark:text-white',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    progressBg: 'bg-green-300 dark:bg-green-700',
    progressText: 'text-green-800 dark:text-green-200',
  },
  'Backlog': {
    bgColor: 'bg-gray-300 dark:bg-gray-700',
    borderColor: 'border-gray-400 dark:border-gray-600',
    textColor: 'text-gray-900 dark:text-gray-100',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    progressBg: 'bg-gray-200 dark:bg-gray-600',
    progressText: 'text-gray-700 dark:text-gray-300',
  },
  'In Review': {
    bgColor: 'bg-purple-500 dark:bg-purple-600',
    borderColor: 'border-purple-600 dark:border-purple-700',
    textColor: 'text-white dark:text-white',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    progressBg: 'bg-purple-300 dark:bg-purple-700',
    progressText: 'text-purple-800 dark:text-purple-200',
  },
  'Blocked': {
    bgColor: 'bg-red-500 dark:bg-red-600',
    borderColor: 'border-red-600 dark:border-red-700',
    textColor: 'text-white dark:text-white',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    progressBg: 'bg-red-300 dark:bg-red-700',
    progressText: 'text-red-800 dark:text-red-200',
  },
  'Closed': {
    bgColor: 'bg-gray-600 dark:bg-gray-700',
    borderColor: 'border-gray-700 dark:border-gray-600',
    textColor: 'text-white dark:text-white',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    progressBg: 'bg-gray-300 dark:bg-gray-600',
    progressText: 'text-gray-700 dark:text-gray-300',
  },
};

export const issueTypeBarColors: Record<string, { bg: string; border: string; borderColor: string; progressBg: string; progressText: string }> = {
  epic: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    borderColor: '#a855f7', // purple-500
    progressBg: 'bg-purple-300 dark:bg-purple-700',
    progressText: 'text-purple-700 dark:text-purple-200',
  },
  story: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    borderColor: '#22c55e', // green-500
    progressBg: 'bg-green-300 dark:bg-green-700',
    progressText: 'text-green-700 dark:text-green-200',
  },
  task: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    borderColor: '#3b82f6', // blue-500
    progressBg: 'bg-blue-300 dark:bg-blue-700',
    progressText: 'text-blue-700 dark:text-blue-200',
  },
  bug: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    borderColor: '#ef4444', // red-500
    progressBg: 'bg-red-300 dark:bg-red-700',
    progressText: 'text-red-700 dark:text-red-200',
  },
  subtask: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    borderColor: '#6b7280', // gray-500
    progressBg: 'bg-gray-300 dark:bg-gray-600',
    progressText: 'text-gray-700 dark:text-gray-300',
  },
};

export const typeColorBadge: Record<string, string> = {
  epic: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold',
  story: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold',
  task: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold',
  bug: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold',
  subtask: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold',
};

export const getPriorityColor = (priority?: string) => {
  const map: Record<string, string> = {
    lowest: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    low: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
    medium: 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400',
    high: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
    highest: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
  };
  return map[priority?.toLowerCase() || 'medium'] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

export const getTypeIcon = (type: string) => {
  const map: Record<string, string> = {
    epic: '🎯',
    story: '📖',
    task: '✓',
    bug: '🐛',
    subtask: '↳',
  };
  return map[type?.toLowerCase() || ''] || '•';
};
