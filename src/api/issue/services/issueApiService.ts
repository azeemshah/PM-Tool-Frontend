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
	TaskType
} from '../types';

const ISSUES_ENDPOINT = '/issues';

export const issueApiService = {
	// ==================== EPICS ====================

	/**
	 * Create Epic
	 * POST /issues/epic
	 */
	async createEpic(data: CreateItemDto): Promise<Epic> {
		const response = await API.post(`/items/create`, data);
		return response.data.data || response.data;
	},

	async createItem(data: CreateItemDto): Promise<TaskType> {
		const response = await API.post(`/items/create`, data);
		return response.data.data || response.data;
	},

	async updateItem(itemId: string, data: UpdateIssueDTO): Promise<any> {
		const response = await API.patch(`/items/${itemId}`, data);
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
		const resp = await API.get(`items/workspace/${workspaceId}`);
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

	async getTasksByWorkspace(workspaceId: string): Promise<TaskType[]> {
		const resp = await API.get(`items/workspace/${workspaceId}`);

		return (resp.data?.data || resp.data || []).map((task: any) => ({
			_id: task._id,
			title: task.title,
			description: task.description,
			type: task.type,
			status: task.status,
			priority: task.priority,
			assignedTo: task.assignedTo
				? {
					_id: task.assignedTo._id,
					name: task.assignedTo.name,
					profilePicture: task.assignedTo.profilePicture ?? null,
				}
				: null,
			reporter: task.reporter
				? {
					_id: task.reporter._id,
					name: task.reporter.name,
					profilePicture: task.reporter.profilePicture ?? null,
				}
				: null,
			createdBy: task.createdBy || null,
			dueDate: task.dueDate || '',
			taskCode: task.taskCode || '',
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			column: task.column || null,
			parent: task.parent || null,
			path: task.path || '',
			workspace: task.workspace,
		}));
	},

	async moveItemToColumn(itemId: string, columnId: string): Promise<any> {
		const response = await API.patch(`/items/${itemId}/move/column/${columnId}`);
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
	 * Create Subtask under Story/Task/Bug
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
	 * Get Story/Task/Bug children under Epic
	 * GET /issues/epic/:epicId/children
	 */
	async getEpicChildren(epicId: string): Promise<(Story | Task | Bug)[]> {
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
	 * GET /issues/:id
	 */
	async getIssue(issueId: string): Promise<Issue> {
		const response = await API.get(`${ISSUES_ENDPOINT}/${issueId}`);
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
	 * POST /items/update/:id
	 */
	async updateIssue(issueId: string, data: UpdateIssueDTO): Promise<Issue> {
		const response = await API.post(`/items/update/${issueId}`, data);
		return response.data.data || response.data;
	},

	/**
	 * Delete any issue (works for all types)
	 * DELETE /items/delete/:id
	 */
	async deleteIssue(issueId: string): Promise<void> {
		await API.delete(`/items/delete/${issueId}`);
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
};





