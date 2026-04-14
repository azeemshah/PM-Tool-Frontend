/**
 * Issue API Service
 * Handles all Issue API calls (Epic, Story, Task, Bug, Subtask)
 */

import API from '@/lib/axios-client';
import type {
	Issue,
	Epic,
	Story,
	Task,
	Bug,
	Subtask,
	CreateEpicDTO,
	CreateStoryDTO,
	CreateTaskDTO,
	CreateBugDTO,
	CreateSubtaskDTO,
	UpdateIssueDTO,
	GetIssuesResponse,
	CreateItemDto,
	ItemType,
	TaskType,
	Improvement
} from '../types';

const ISSUES_ENDPOINT = '/pm-issues';

export type GetTasksByWorkspaceParams = {
	page?: number;
	limit?: number;
	status?: string;
	priority?: string;
	type?: string;
	reporter?: string;
	keyword?: string;
};

export type PaginatedTasksResponse = {
	data: TaskType[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
};


export const issueApiService = {
	// ==================== EPICS ====================

	/**
	 * Create Epic
	 * POST /issues/epic
	 */
	async createEpic(data: CreateItemDto): Promise<Epic> {
		const response = await API.post(`/pm-items/create`, data);
		return response.data.data || response.data;
	},

	async createItem(data: CreateItemDto): Promise<TaskType> {
		const response = await API.post(`/pm-items/create`, data);
		return response.data.data || response.data;
	},

	async updateItem(itemId: string, data: UpdateIssueDTO): Promise<any> {
		const response = await API.patch(`/pm-items/${itemId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Get all Epics in a project
	 * GET /issues/epic/:projectId
	 */
	async getEpicsByProject(projectId: string): Promise<Epic[]> {
		const url = `${ISSUES_ENDPOINT}/epic/${projectId}`;
		console.log('📤 getEpicsByProject - fetching from URL:', url);
		const response = await API.get(url);
		console.log('📥 getEpicsByProject - response:', response.data);
		const data = response.data.data || response.data;
		console.log('📥 getEpicsByProject - extracted data:', data);
		const result = Array.isArray(data) ? data : [];
		console.log('📥 getEpicsByProject - returning:', result);
		return result;
	},

	async getEpicsByWorkspace(workspaceId: string): Promise<Epic[]> {
		const resp = await API.get(`pm-items/workspace/${workspaceId}`);
		const items = resp.data?.data || resp.data || [];

		return (items as any[])
			.filter((item) => item.type === 'epic')
			.map(
				(item) =>
					({
						_id: item._id,
						projectId: item.workspace,
						type: 'epic',
						title: item.title,
						description: item.description,
						priority: item.priority,
						dueDate: item.dueDate || null,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt
					}) as Epic
			);
	},

	/**
	 * Get single Epic with all children
	 * GET /issues/epic/:epicId
	 */
	async getEpic(epicId: string): Promise<Epic> {
		const response = await API.get(`${ISSUES_ENDPOINT}/epic/${epicId}`);
		return response.data.data || response.data;
	},

	/**
	 * Update Epic
	 * PATCH /issues/:epicId
	 */
	async updateEpic(epicId: string, data: UpdateIssueDTO): Promise<Epic> {
		const response = await API.patch(`${ISSUES_ENDPOINT}/${epicId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete Epic (cascades to children)
	 * DELETE /issues/:epicId
	 */
	async deleteEpic(epicId: string): Promise<void> {
		await API.delete(`${ISSUES_ENDPOINT}/${epicId}`);
	},

	// ==================== STORIES ====================

	/**
	 * Create Story under Epic
	 * POST /issues/epic/:epicId/story
	 */
	async createStory(epicId: string, data: CreateStoryDTO): Promise<Story> {
		const response = await API.post(`${ISSUES_ENDPOINT}/epic/${epicId}/story`, data);
		return response.data.data || response.data;
	},

	/**
	 * Update Story
	 * PATCH /issues/:storyId
	 */
	async updateStory(storyId: string, data: UpdateIssueDTO): Promise<Story> {
		const response = await API.patch(`${ISSUES_ENDPOINT}/${storyId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete Story (cascades to subtasks)
	 * DELETE /issues/:storyId
	 */
	async deleteStory(storyId: string): Promise<void> {
		await API.delete(`${ISSUES_ENDPOINT}/${storyId}`);
	},

	/**
	 * Create Story WITHOUT Epic (Epic is optional, can be added later)
	 * POST /issues/story
	 * This allows creating a Story without immediately assigning an Epic
	 * The Epic can be added or changed later via PATCH /issues/:id
	 */
	async createStoryWithoutEpic(data: CreateStoryDTO): Promise<Story> {
		const response = await API.post(`${ISSUES_ENDPOINT}/story`, data);
		return response.data.data || response.data;
	},

	// ==================== TASKS ====================

	/**
	 * Create Task under Epic (NOT under Story)
	 * POST /issues/epic/:epicId/task
	 * 
	 * 
	 */


	async createTask(epicId: string, data: CreateTaskDTO): Promise<Task> {
		const response = await API.post(`${ISSUES_ENDPOINT}/epic/${epicId}/task`, data);
		return response.data.data || response.data;
	},

	/**
	 * Create Task WITHOUT Epic (Epic is optional, can be added later)
	 * POST /issues/task
	 * This allows creating a Task without immediately assigning an Epic
	 * The Epic can be added or changed later via PATCH /issues/:id
	 */
	async createTaskWithoutEpic(data: CreateTaskDTO): Promise<Task> {
		const response = await API.post(`${ISSUES_ENDPOINT}/task`, data);
		return response.data.data || response.data;
	},

	/**
	 * Update Task
	 * PATCH /issues/:taskId
	 */
	async updateTask(taskId: string, data: UpdateIssueDTO): Promise<Task> {
		const response = await API.patch(`${ISSUES_ENDPOINT}/${taskId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete Task (cascades to subtasks)
	 * DELETE /issues/:taskId
	 */
	async deleteTask(taskId: string): Promise<void> {
		await API.delete(`${ISSUES_ENDPOINT}/${taskId}`);
	},

	async getTasksByWorkspace(
		workspaceId: string,
		params?: {
			page?: number;
			limit?: number;
			status?: string;
			priority?: string;
			type?: string;
			reporter?: string;
			keyword?: string;
		}
	): Promise<{
		data: TaskType[];
		meta: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		};
	}> {
		const resp = await API.get(`pm-items/workspace/${workspaceId}`, {
			params,
		});

		return resp.data;
	},


	async moveItemToColumn(itemId: string, columnId: string): Promise<any> {
		const response = await API.patch(`/pm-items/${itemId}/move/column/${columnId}`);
		return response.data.data || response.data;
	},



	// ==================== BUGS ====================

	/**
	 * Create Bug under Epic
	 * POST /issues/epic/:epicId/bug
	 */
	async createBug(epicId: string, data: CreateBugDTO): Promise<Bug> {
		const response = await API.post(`${ISSUES_ENDPOINT}/epic/${epicId}/bug`, data);
		return response.data.data || response.data;
	},

	/**
	 * Update Bug
	 * PATCH /issues/:bugId
	 */
	async updateBug(bugId: string, data: UpdateIssueDTO): Promise<Bug> {
		const response = await API.patch(`${ISSUES_ENDPOINT}/${bugId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete Bug (cascades to subtasks)
	 * DELETE /issues/:bugId
	 */
	async deleteBug(bugId: string): Promise<void> {
		await API.delete(`${ISSUES_ENDPOINT}/${bugId}`);
	},

	// ==================== SUBTASKS ====================

	/**
	 * Create Subtask under Story/Task/Bug/Improvement
	 * POST /issues/:parentId/subtask
	 */
	async createSubtask(parentIssueId: string, data: CreateSubtaskDTO): Promise<Subtask> {
		const response = await API.post(`${ISSUES_ENDPOINT}/${parentIssueId}/subtask`, data);
		return response.data.data || response.data;
	},

	/**
	 * Get all Subtasks under parent
	 * GET /issues/:parentId/subtasks
	 */
	async getSubtasks(parentIssueId: string): Promise<Subtask[]> {
		const response = await API.get(`${ISSUES_ENDPOINT}/${parentIssueId}/subtasks`);
		const data = response.data.data || response.data;
		return Array.isArray(data) ? data : [];
	},

	/**
	 * Update Subtask
	 * PATCH /issues/:subtaskId
	 */
	async updateSubtask(subtaskId: string, data: UpdateIssueDTO): Promise<Subtask> {
		const response = await API.patch(`${ISSUES_ENDPOINT}/${subtaskId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete Subtask
	 * DELETE /issues/:subtaskId
	 */
	async deleteSubtask(subtaskId: string): Promise<void> {
		await API.delete(`${ISSUES_ENDPOINT}/${subtaskId}`);
	},

	// ==================== QUERIES ====================

	/**
	 * Get Story/Task/Bug/Improvement children under Epic
	 * GET /issues/epic/:epicId/children
	 */
	async getEpicChildren(epicId: string): Promise<(Story | Task | Bug | Improvement)[]> {
		const response = await API.get(`${ISSUES_ENDPOINT}/epic/${epicId}/children`);
		const data = response.data.data || response.data;
		return Array.isArray(data) ? data : [];
	},

	/**
	 * Get all issues in a project
	 * GET /issues/project/:projectId
	 */
	async getIssuesByProject(projectId: string, page = 1): Promise<GetIssuesResponse> {
		const response = await API.get(`${ISSUES_ENDPOINT}/project/${projectId}?page=${page}`);
		return response.data.data || response.data;
	},

	/**
	 * Get single issue by ID
	 * GET /items/:id
	 */
	async getIssue(issueId: string): Promise<Issue> {
		// Use /items endpoint which matches WorkItemController
		const response = await API.get(`/pm-items/${issueId}`);
		return response.data.data || response.data;
	},

	/**
	 * Get issues by type
	 * GET /issues/project/:projectId?type=story
	 */
	async getIssuesByType(projectId: string, type: string): Promise<Issue[]> {
		const response = await API.get(`${ISSUES_ENDPOINT}/project/${projectId}?type=${type}`);
		const data = response.data.data || response.data;
		return Array.isArray(data) ? data : [];
	},

	// ==================== COMMON OPERATIONS ====================

	/**
	 * Update any issue (works for all types)
	 * PATCH /items/:id
	 */
	async updateIssue(issueId: string, data: UpdateIssueDTO): Promise<Issue> {
		const payload: any = { ...data };
		// Backend expects 'assignedTo' and 'parent' directly, no mapping needed.
		// And use /items endpoint which matches ItemController

		const response = await API.patch(`/pm-items/${issueId}`, payload);
		return response.data.data || response.data;
	},

	/**
	 * Log work against an item
	 * POST /items/:id/log-work
	 */
	async logWork(itemId: string, data: { timeSpent: number; comment?: string; adjustRemaining?: boolean }) {
		const response = await API.post(`/pm-items/${itemId}/log-work`, data);
		return response.data.data || response.data;
	},

	/**
	 * Set original estimate
	 * POST /items/:id/estimate
	 */
	async setEstimate(itemId: string, data: { originalEstimate: number }) {
		const response = await API.post(`/pm-items/${itemId}/estimate`, data);
		return response.data.data || response.data;
	},

	/**
	 * Get time tracking summary and logs
	 * GET /items/:id/time-tracking
	 */
	async getTimeTracking(itemId: string) {
		const response = await API.get(`/pm-items/${itemId}/time-tracking`);
		return response.data.data || response.data;
	},

	/**
	 * Delete any issue (works for all types)
	 * DELETE /items/delete/:id
	 */
	async deleteIssue(issueId: string): Promise<void> {
		await API.delete(`/pm-items/delete/${issueId}`);
	},

	/**
	 * Assign issue to user
	 * PATCH /issues/:id
	 */
	async assignIssue(issueId: string, userId: string): Promise<Issue> {
		return this.updateIssue(issueId, { assignedTo: userId });
	},

	/**
	 * Change issue status
	 * PATCH /issues/:id
	 */
	async changeIssueStatus(issueId: string, status: string): Promise<Issue> {
		return this.updateIssue(issueId, { status } as UpdateIssueDTO);
	},

	/**
	 * Change issue priority
	 * PATCH /issues/:id
	 */
	async changeIssuePriority(issueId: string, priority: string): Promise<Issue> {
		return this.updateIssue(issueId, { priority } as UpdateIssueDTO);
	},

	// ==================== TIME LOGGING (8.2) ====================

	/**
	 * Start a timer for an issue
	 * POST /time-logs/start
	 */
	async startTimer(issueId: string) {
		const response = await API.post('/pm-time-logs/start', { issueId });
		return response.data.data || response.data;
	},

	/**
	 * Stop the active timer
	 * POST /time-logs/stop
	 */
	async stopTimer(issueId: string, comment?: string) {
		const response = await API.post('/pm-time-logs/stop', { issueId, comment });
		return response.data.data || response.data;
	},

	/**
	 * Get active timer for a user
	 * GET /time-logs/active/:userId
	 */
	async getActiveTimer(userId: string) {
		const response = await API.get(`/pm-time-logs/active/${userId}`);
		return response.data.data || response.data;
	},

	/**
	 * Get all time logs for an issue
	 * GET /time-logs/issue/:issueId
	 */
	async getIssueLogs(issueId: string) {
		const response = await API.get(`/pm-time-logs/issue/${issueId}`);
		return response.data.data || response.data;
	},

	/**
	 * Get all time logs for a user
	 * GET /time-logs/user/:userId
	 */
	async getUserLogs(userId: string) {
		const response = await API.get(`/pm-time-logs/user/${userId}`);
		return response.data.data || response.data;
	},

	/**
	 * Get timesheet with daily/weekly grouping
	 * GET /time-logs/timesheet?userId=&from=&to=
	 */
	async getTimesheet(userId: string, fromDate: string, toDate: string) {
		const response = await API.get('/pm-time-logs/timesheet', {
			params: { userId, from: fromDate, to: toDate },
		});
		return response.data.data || response.data;
	},

	/**
	 * Edit a time log
	 * PUT /time-logs/:id
	 */
	async updateTimeLog(logId: string, data: { timeSpent?: number; comment?: string; logDate?: string }) {
		const response = await API.put(`/pm-time-logs/${logId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete a time log
	 * DELETE /time-logs/:id
	 */
	async deleteTimeLog(logId: string) {
		const response = await API.delete(`/pm-time-logs/${logId}`);
		return response.data.data || response.data;
	},
};





