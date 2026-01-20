import API from '@/lib/axios-client';
import { Sprint, CreateSprintDto } from '../types';

const SPRINT_ENDPOINT = '/sprints';

export const SprintApiService = {
  // Get all sprints for workspace
  async getWorkspaceSprints(workspaceId: string): Promise<Sprint[]> {
    const response = await API.get(`${SPRINT_ENDPOINT}/workspace/${workspaceId}`);
    return response.data.data || response.data;
  },

  // Create new sprint
  async createSprint(data: CreateSprintDto): Promise<Sprint> {
    const response = await API.post(SPRINT_ENDPOINT, data);
    return response.data.data || response.data;
  },

  // Start sprint
  async startSprint(sprintId: string): Promise<Sprint> {
    const response = await API.patch(`${SPRINT_ENDPOINT}/${sprintId}/start`);
    return response.data.data || response.data;
  },

  // Complete sprint
  async completeSprint(sprintId: string): Promise<Sprint> {
    const response = await API.patch(`${SPRINT_ENDPOINT}/${sprintId}/complete`);
    return response.data.data || response.data;
  },

  // Reopen sprint
  async reopenSprint(sprintId: string): Promise<Sprint> {
    const response = await API.patch(`${SPRINT_ENDPOINT}/${sprintId}/reopen`);
    return response.data.data || response.data;
  },

  // Add work items to sprint
  async addWorkItemsToSprint(sprintId: string, workItemIds: string[]): Promise<any> {
    const response = await API.patch(`${SPRINT_ENDPOINT}/${sprintId}/add-work-items`, {
      workItemIds
    });
    return response.data.data || response.data;
  },

  // Update sprint columns
  async updateSprintColumns(sprintId: string, columns: string[]): Promise<Sprint> {
    const response = await API.patch(`${SPRINT_ENDPOINT}/${sprintId}/columns`, {
      columns
    });
    return response.data.data || response.data;
  },
};