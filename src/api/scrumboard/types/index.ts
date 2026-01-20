import { KanbanCard } from '../../kanban/types';

export interface Sprint {
  _id: string;
  workspaceId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  workItems: string[]; // Work item IDs
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSprintDto {
  workspaceId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  workItems?: string[];
}

export interface SprintWithWorkItems extends Omit<Sprint, 'workItems'> {
  workItems: KanbanCard[]; // Populated work items
}

export interface SprintStats {
  totalWorkItems: number;
  completedWorkItems: number;
  inProgressWorkItems: number;
  todoWorkItems: number;
  completionPercentage: number;
}