import type { GanttBarColors } from '../types/gantt';

export const statusColorMap: GanttBarColors = {
  'To Do': {
    bgColor: 'bg-gray-200',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-900',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-900',
    progressBg: 'bg-gray-300',
    progressText: 'text-gray-700',
  },
  'In Progress': {
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-600',
    textColor: 'text-white',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-900',
    progressBg: 'bg-blue-300',
    progressText: 'text-blue-700',
  },
  'Done': {
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600',
    textColor: 'text-white',
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-900',
    progressBg: 'bg-green-300',
    progressText: 'text-green-700',
  },
  'Backlog': {
    bgColor: 'bg-gray-300',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-900',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    progressBg: 'bg-gray-200',
    progressText: 'text-gray-600',
  },
  'In Review': {
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-600',
    textColor: 'text-white',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-900',
    progressBg: 'bg-purple-300',
    progressText: 'text-purple-700',
  },
  'Blocked': {
    bgColor: 'bg-red-500',
    borderColor: 'border-red-600',
    textColor: 'text-white',
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-900',
    progressBg: 'bg-red-300',
    progressText: 'text-red-700',
  },
  'Closed': {
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-700',
    textColor: 'text-white',
    bg: 'bg-gray-200',
    border: 'border-gray-400',
    text: 'text-gray-700',
    progressBg: 'bg-gray-300',
    progressText: 'text-gray-700',
  },
};

export const issueTypeBarColors: Record<string, { bg: string; border: string; borderColor: string; progressBg: string; progressText: string }> = {
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    borderColor: '#a855f7', // purple-500
    progressBg: 'bg-purple-300',
    progressText: 'text-purple-700',
  },
  story: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    borderColor: '#22c55e', // green-500
    progressBg: 'bg-green-300',
    progressText: 'text-green-700',
  },
  task: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    borderColor: '#3b82f6', // blue-500
    progressBg: 'bg-blue-300',
    progressText: 'text-blue-700',
  },
  bug: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    borderColor: '#ef4444', // red-500
    progressBg: 'bg-red-300',
    progressText: 'text-red-700',
  },
  subtask: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    borderColor: '#6b7280', // gray-500
    progressBg: 'bg-gray-300',
    progressText: 'text-gray-700',
  },
};

export const typeColorBadge: Record<string, string> = {
  epic: 'bg-purple-100 text-purple-700 font-semibold',
  story: 'bg-green-100 text-green-700 font-semibold',
  task: 'bg-blue-100 text-blue-700 font-semibold',
  bug: 'bg-red-100 text-red-700 font-semibold',
  subtask: 'bg-gray-100 text-gray-700 font-semibold',
};

export const getPriorityColor = (priority?: string) => {
  const map: Record<string, string> = {
    lowest: 'bg-blue-50 text-blue-600',
    low: 'bg-cyan-50 text-cyan-600',
    medium: 'bg-yellow-50 text-yellow-600',
    high: 'bg-orange-50 text-orange-600',
    highest: 'bg-red-50 text-red-600',
  };
  return map[priority?.toLowerCase() || 'medium'] || 'bg-gray-100 text-gray-600';
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
