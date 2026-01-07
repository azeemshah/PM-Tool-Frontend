/**
 * Issue API Types
 * Unified Issue types for Epic, Story, Task, Bug, Subtask
 */

export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'subtask';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type IssueStatus = 'to-do' | 'in-progress' | 'in-review' | 'done' | 'blocked';

// ==================== BASE ISSUE INTERFACE ====================
export interface Issue {
	_id: string;
	projectId: string;
	type: IssueType;
	title: string;
	description?: string;
	priority?: IssuePriority;
	status?: IssueStatus;
	reporter?: { _id: string; name: string; email?: string };
	assignee?: { _id: string; name: string; email?: string };
	labels?: string[];
	dueDate?: string | null;
	createdAt?: string;
	updatedAt?: string;
	
	// Hierarchy fields
	epicId?: string; // For Story, Task, Bug (parent Epic)
	parentIssueId?: string; // For Subtask (parent Story/Task/Bug)
	
	// Computed fields
	key?: string; // PROJ-123
	attachments?: IssueAttachment[];
	comments?: IssueComment[];
	subtasks?: Issue[];
	children?: Issue[]; // For Epic: Story/Task/Bug
}

// ==================== EPIC SPECIFIC ====================
export interface Epic extends Issue {
	type: 'epic';
	epicId?: never;
	parentIssueId?: never;
	children?: (Story | Task | Bug)[];
}

// ==================== STORY ====================
export interface Story extends Issue {
	type: 'story';
	epicId: string; // Required
	parentIssueId?: never;
	subtasks?: Subtask[];
}

// ==================== TASK ====================
export interface Task extends Issue {
	type: 'task';
	epicId: string; // Required (NOW UNDER EPIC, NOT STORY)
	parentIssueId?: never;
	subtasks?: Subtask[];
}

// ==================== BUG ====================
export interface Bug extends Issue {
	type: 'bug';
	epicId: string; // Required (NOW UNDER EPIC)
	parentIssueId?: never;
	subtasks?: Subtask[];
}

// ==================== SUBTASK ====================
export interface Subtask extends Issue {
	type: 'subtask';
	epicId?: never;
	parentIssueId: string; // Required (parent Story/Task/Bug)
}

// ==================== ATTACHMENTS ====================
export interface IssueAttachment {
	_id: string;
	name: string;
	url: string;
	type?: string;
	size?: number;
	createdAt?: string;
}

// ==================== COMMENTS ====================
export interface IssueComment {
	_id: string;
	author: { _id: string; name: string };
	content: string;
	createdAt: string;
}

// ==================== DTO TYPES ====================

// Create Epic DTO
export interface CreateEpicDTO {
	projectId: string;
	title: string;
	description?: string;
	reporter: string;
	priority?: IssuePriority;
}

// Create Story DTO
export interface CreateStoryDTO {
	projectId: string;
	title: string;
	description?: string;
	reporter: string;
	priority?: IssuePriority;
	// epicId comes from URL: POST /issues/epic/:epicId/story
}

// Create Task DTO
export interface CreateTaskDTO {
	projectId: string;
	title: string;
	description?: string;
	reporter: string;
	priority?: IssuePriority;
	// epicId comes from URL: POST /issues/epic/:epicId/task
}

// Create Bug DTO
export interface CreateBugDTO {
	projectId: string;
	title: string;
	description?: string;
	reporter: string;
	priority?: IssuePriority;
	// epicId comes from URL: POST /issues/epic/:epicId/bug
}

// Create Subtask DTO
export interface CreateSubtaskDTO {
	projectId: string;
	title: string;
	description?: string;
	reporter: string;
	priority?: IssuePriority;
	// parentIssueId comes from URL: POST /issues/:parentId/subtask
}

// Update Issue DTO (for any issue type)
export interface UpdateIssueDTO {
	title?: string;
	description?: string;
	status?: IssueStatus;
	priority?: IssuePriority;
	assignee?: string;
	labels?: string[];
	dueDate?: string | null;
	reporter?: string;
}

// ==================== QUERY RESPONSE TYPES ====================

export interface GetEpicsResponse {
	data: Epic[];
	total: number;
	page: number;
}

export interface GetChildrenResponse {
	data: (Story | Task | Bug)[];
	total: number;
}

export interface GetSubtasksResponse {
	data: Subtask[];
	total: number;
}

export interface GetIssuesResponse {
	data: Issue[];
	total: number;
	page: number;
}

// ==================== ERROR TYPES ====================

export interface IssueError {
	message: string;
	code?: string;
	field?: string;
}
