/**
 * Scrumboard TypeScript Types
 * مکمل type definitions
 */

// ==================== MEMBERS ====================
export interface ScrumboardMember {
	_id: string;
	name: string;
	avatar?: string;
	profilePicture?: string;
}

// ==================== LABELS ====================
export interface ScrumboardLabel {
	_id: string;
	board: string; // boardId
	name: string;
	color?: string;
}

// ==================== LISTS / COLUMNS ====================
export interface ScrumboardList {
	_id: string;
	board: string; // boardId
	name: string;
	description?: string;
	position: number;
	workItems?: string[]; // Work item IDs
}

// ==================== CHECKLISTS ====================
export interface CheckListItem {
	id: number;
	name: string;
	checked: boolean;
}

export interface ScrumboardChecklist {
	id?: string;
	name: string;
	checkItems: CheckListItem[];
}

// ==================== ATTACHMENTS ====================
export interface ScrumboardAttachment {
	_id: string;
	name: string;
	src: string;
	url: string;
	createdAt: number;
	type?: string;
}

// ==================== COMMENTS ====================
export interface ScrumboardComment {
	_id: string;
	workItem: string; // workItemId
	author?: { _id: string; name: string };
	content: string;
	createdAt: string;
	attachments?: string[];
}

// ==================== ACTIVITY ====================
export interface Activity {
	_id: string;
	type: 'create' | 'update' | 'move' | 'comment' | 'attachment';
	workItem: string; // workItemId
	user?: string; // userId
	message: string;
	createdAt: string;
	metadata?: Record<string, unknown>;
}

// ==================== CARDS / WORK ITEMS ====================
export interface ScrumboardCard {
	_id: string;
	board: string; // boardId
	column?: string; // columnId / listId
	title: string;
	description?: string;
	type?: string; // Task, Bug, etc.
	status?: string; // To Do, In Progress, etc.
	priority?: string; // Low, Medium, High
	labels?: string[]; // label IDs
	dueDate?: string | null;
	assignee?: { _id: string; name: string };
	attachmentCoverId?: string;
	attachments?: ScrumboardAttachment[];
	checklists?: ScrumboardChecklist[];
	comments?: ScrumboardComment[];
	metadata?: Record<string, any>;
	createdAt?: string;
	updatedAt?: string;
}

// ==================== BOARDS ====================
export interface ScrumboardBoard {
	_id: string;
	name: string;
	description?: string;
	columns: string[]; // Column IDs
	createdAt?: string;
	updatedAt?: string;
	labels?: ScrumboardLabel[];
}

// ==================== DTO Types ====================
export interface CreateBoardDTO {
	name: string;
	description?: string;
}

export interface UpdateBoardDTO {
	name?: string;
	description?: string;
	columns?: string[];
}

export interface CreateListDTO {
	name: string;
	description?: string;
	board: string;
}

export interface UpdateListDTO {
	name?: string;
	description?: string;
	position?: number;
}

export interface CreateCardDTO {
	title: string;
	description?: string;
	board: string;
	column?: string;
	type?: string;
	status?: string;
	priority?: string;
}

export interface UpdateCardDTO {
	title?: string;
	description?: string;
	status?: string;
	priority?: string;
	labels?: string[];
	assignee?: string;
	dueDate?: string | null;
	metadata?: Record<string, any>;
}

export interface CreateLabelDTO {
	name: string;
	color?: string;
	board: string;
}

export interface UpdateLabelDTO {
	name?: string;
	color?: string;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

// ==================== Drag & Drop Types ====================
export interface DropResult {
	source: {
		droppableId: string;
		index: number;
	};
	destination?: {
		droppableId: string;
		index: number;
	};
	draggableId: string;
	type: 'list' | 'card';
}
