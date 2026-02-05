import { ItemType, ItemStatus, ItemPriority } from '@/api/issue/types';

/**
 * Gantt Chart Data Types
 */

export interface GanttItem {
  _id: string;
  title: string;
  type: ItemType;
  status: ItemStatus;
  priority?: ItemPriority;
  assignedTo?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  startDate?: Date | string;
  dueDate?: Date | string;
  originalEstimate?: number;
  timeSpent?: number;
  remainingEstimate?: number;
  storyPoints?: number;
  parent?: string;
  workspace: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface GanttTreeNode {
  item: GanttItem;
  children: GanttTreeNode[];
  level: number;
  isExpanded: boolean;
  barStart: number;
  barWidth: number;
  progressPercent: number;
}

export type ViewType = 'week' | 'month';

export interface GanttFilters {
  statuses?: ItemStatus[];
  assignees?: string[];
  types?: ItemType[];
  searchText?: string;
  status?: ItemStatus[];
  assignee?: string[];
  type?: ItemType[];
}

export interface TimelineRange {
  start: Date;
  end: Date;
  dayCount: number;
  pixelsPerDay: number;
}

export interface GanttBarColors {
  [status: string]: {
    bg: string;
    border: string;
    text: string;
    bgColor?: string;
    borderColor?: string;
    textColor?: string;
    progressBg?: string;
    progressText?: string;
  };
}
