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

const DYNAMIC_PALETTE = [
  { name: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white', lightBg: 'bg-cyan-100', lightBorder: 'border-cyan-200', lightText: 'text-cyan-700' },
  { name: 'orange', bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', lightBg: 'bg-orange-100', lightBorder: 'border-orange-200', lightText: 'text-orange-700' },
  { name: 'pink', bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white', lightBg: 'bg-pink-100', lightBorder: 'border-pink-200', lightText: 'text-pink-700' },
  { name: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white', lightBg: 'bg-indigo-100', lightBorder: 'border-indigo-200', lightText: 'text-indigo-700' },
  { name: 'teal', bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white', lightBg: 'bg-teal-100', lightBorder: 'border-teal-200', lightText: 'text-teal-700' },
  { name: 'lime', bg: 'bg-lime-500', border: 'border-lime-600', text: 'text-white', lightBg: 'bg-lime-100', lightBorder: 'border-lime-200', lightText: 'text-lime-700' },
  { name: 'fuchsia', bg: 'bg-fuchsia-500', border: 'border-fuchsia-600', text: 'text-white', lightBg: 'bg-fuchsia-100', lightBorder: 'border-fuchsia-200', lightText: 'text-fuchsia-700' },
  { name: 'rose', bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white', lightBg: 'bg-rose-100', lightBorder: 'border-rose-200', lightText: 'text-rose-700' },
  { name: 'violet', bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-white', lightBg: 'bg-violet-100', lightBorder: 'border-violet-200', lightText: 'text-violet-700' },
  { name: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white', lightBg: 'bg-emerald-100', lightBorder: 'border-emerald-200', lightText: 'text-emerald-700' },
];

export const getGanttStatusColor = (status: string) => {
  const normalized = normalizeGanttStatus(status);

  // Check if it's a standard status first
  if (statusColorMap[normalized]) {
    return statusColorMap[normalized];
  }

  // If not found in map (even after normalization), generate dynamic color
  // Use original status string for hashing to ensure unique colors for different custom statuses
  const hash = status.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = DYNAMIC_PALETTE[hash % DYNAMIC_PALETTE.length];

  return {
    bgColor: `${color.bg} dark:${color.bg.replace('500', '600')}`,
    borderColor: `${color.border} dark:${color.border.replace('600', '700')}`,
    textColor: `${color.text} dark:${color.text}`,
    bg: `${color.lightBg} dark:${color.bg.replace('500', '900')}/30`,
    border: `${color.lightBorder} dark:${color.border.replace('600', '800')}`,
    text: `${color.lightText} dark:${color.lightText.replace('700', '300')}`,
    progressBg: `${color.bg.replace('500', '300')} dark:${color.bg.replace('500', '700')}`,
    progressText: `${color.lightText.replace('700', '800')} dark:${color.lightText.replace('700', '200')}`,
  };
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

export function normalizeGanttStatus(status: string): string {
  if (!status) return 'To Do';

  const s = status.toLowerCase().replace(/[\s-_]+/g, '');

  if (s === 'todo') return 'To Do';
  if (s === 'inprogress') return 'In Progress';
  if (s === 'inreview') return 'In Review';
  if (s === 'done') return 'Done';
  if (s === 'blocked') return 'Blocked';
  if (s === 'backlog') return 'Backlog';
  if (s === 'closed') return 'Closed';

  // Fallback for partial matches
  if (s.includes('review')) return 'In Review';
  if (s.includes('progress')) return 'In Progress';

  return status;
}

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
