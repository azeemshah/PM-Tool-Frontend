/**
 * Kanban API Service
 * تمام API calls یہاں ہیں
 */

import type {
	KanbanBoard,
	KanbanCard,
	KanbanList,
	KanbanLabel,
	KanbanMember,
	CreateBoardDTO,
	UpdateBoardDTO,
	CreateListDTO,
	UpdateListDTO,
	CreateCardDTO,
	UpdateCardDTO,
	CreateLabelDTO,
	UpdateLabelDTO,
} from '../types';
import API from '@/lib/axios-client';

const KANBAN_ENDPOINT = '/kanban';

export const KanbanApiService = {
	// ==================== BOARDS ====================

	async getKanbanBoards(workspaceId?: string): Promise<KanbanBoard[]> {
		try {
			const endpoint = workspaceId 
				? `${KANBAN_ENDPOINT}/board/workspaces/${workspaceId}/boards`
				: `${KANBAN_ENDPOINT}/board/boards`;
			
			const response = await API.get(endpoint);
			console.log('Get boards response:', response);
			
			// Handle array responses
			if (Array.isArray(response.data)) {
				return response.data;
			}
			
			// Handle {data: [...]} format
			if (response.data && Array.isArray(response.data.data)) {
				return response.data.data;
			}
			
			// Handle {boards: [...]} format
			if (response.data && Array.isArray(response.data.boards)) {
				return response.data.boards;
			}
			
			console.warn('Unexpected boards response format:', response.data);
			return Array.isArray(response.data) ? response.data : [];
		} catch (error) {
			console.error('getKanbanBoards error:', error);
			throw error;
		}
	},

	async getKanbanBoard(boardId: string): Promise<KanbanBoard> {
		const response = await API.get(`${KANBAN_ENDPOINT}/board/${boardId}`);
		return response.data.data || response.data;
	},

	async createKanbanBoard(data: CreateBoardDTO): Promise<KanbanBoard> {
		try {
			const response = await API.post(`${KANBAN_ENDPOINT}/boards`, data);
			console.log('Create board response:', response);
			
			// Handle different response formats
			if (response.data && response.data.data) {
				return response.data.data;
			}
			
			if (response.data && response.data._id) {
				return response.data;
			}
			
			// If response is the board itself
			if (response.data._id) {
				return response.data;
			}
			
			throw new Error('Invalid response format: no board data found');
		} catch (error) {
			console.error('createKanbanBoard error:', error);
			throw error;
		}
	},

	async updateKanbanBoard(
		boardId: string,
		data: UpdateBoardDTO
	): Promise<KanbanBoard> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}`, data);
		return response.data.data || response.data;
	},

	async deleteKanbanBoard(boardId: string): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/boards/${boardId}`);
	},

	// ==================== LISTS ====================

	async getKanbanBoardLists(boardId: string): Promise<KanbanList[]> {
		const response = await API.get(`/column/${boardId}/columns`);
		return response.data.data || response.data;
	},

	async createKanbanBoardList(
		boardId: string,
		data: CreateListDTO
	): Promise<KanbanList> {
		const response = await API.post(`column/create`, data);
		return response.data.data || response.data;
	},

	async updateKanbanBoardList(
		boardId: string,
		listId: string,
		data: UpdateListDTO
	): Promise<KanbanList> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}/columns/${listId}`, data);
		return response.data.data || response.data;
	},

	async deleteKanbanBoardList(
		boardId: string,
		listId: string
	): Promise<void> {
		await API.delete(`column/columns/${listId}`);
	},

	// ==================== CARDS ====================

	async getKanbanBoardCards(boardId: string): Promise<KanbanCard[]> {
		console.log('API: getKanbanBoardCards called for boardId', boardId);
		const response = await API.get(`${KANBAN_ENDPOINT}/items`);
		const items = response.data.data || response.data || [];
		console.log('API: getKanbanBoardCards fetched items count', Array.isArray(items) ? items.length : 0);
		// NOTE: backend items may not include boardId; return all items
		// and let the UI filter by column/status where appropriate.
		console.log('API: getKanbanBoardCards returning all items (UI will filter)');
		return items;
	},

	async createKanbanBoardCard(
		boardId: string,
		listId: string,
		data: CreateCardDTO
	): Promise<KanbanCard> {
		console.log('API: createKanbanBoardCard called', { boardId, listId, data });
		// Backend expects POST /kanban/items with boardId and columnId
		const endpoint = `${KANBAN_ENDPOINT}/items`;
		const payload = {
			title: data.title,
			description: data.description || '',
			type: 'Task', // Default type
			boardId,
			columnId: listId, // Column ID to link card to column
		};
		console.log('API endpoint:', endpoint);
		console.log('API payload:', payload);
		const response = await API.post(endpoint, payload);
		console.log('API response:', response);
		return response.data.data || response.data;
	},

	async updateKanbanBoardCard(
		boardId: string,
		cardId: string,
		data: UpdateCardDTO
	): Promise<KanbanCard> {
		const response = await API.put(`${KANBAN_ENDPOINT}/items/${cardId}`, data);
		return response.data.data || response.data;
	},

	async deleteKanbanBoardCard(
		boardId: string,
		cardId: string
	): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/items/${cardId}`);
	},

	// ==================== LABELS ====================

	async getKanbanBoardLabels(boardId: string): Promise<KanbanLabel[]> {
		const response = await API.get(`${KANBAN_ENDPOINT}/boards/${boardId}/labels`);
		return response.data.data || response.data;
	},

	async createKanbanBoardLabel(
		boardId: string,
		data: CreateLabelDTO
	): Promise<KanbanLabel> {
		const response = await API.post(`${KANBAN_ENDPOINT}/boards/${boardId}/labels`, data);
		return response.data.data || response.data;
	},

	async updateKanbanBoardLabel(
		boardId: string,
		labelId: string,
		data: UpdateLabelDTO
	): Promise<KanbanLabel> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}/labels/${labelId}`, data);
		return response.data.data || response.data;
	},

	async deleteKanbanBoardLabel(
		boardId: string,
		labelId: string
	): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/boards/${boardId}/labels/${labelId}`);
	},

	// ==================== MEMBERS ====================

	async getKanbanMembers(): Promise<KanbanMember[]> {
		const response = await API.get(`${KANBAN_ENDPOINT}/members`);
		return response.data.data || response.data;
	},

	async createKanbanMember(
		data: Partial<KanbanMember>
	): Promise<KanbanMember> {
		const response = await API.post(`${KANBAN_ENDPOINT}/members`, data);
		return response.data.data || response.data;
	},

	async updateKanbanMember(
		memberId: string,
		data: Partial<KanbanMember>
	): Promise<KanbanMember> {
		const response = await API.put(`${KANBAN_ENDPOINT}/members/${memberId}`, data);
		return response.data.data || response.data;
	},

	async deleteKanbanMember(memberId: string): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/members/${memberId}`);
	},

	// ==================== REORDER ====================

	async moveColumn(
		columnId: string,
		position: number
	): Promise<void> {
		await API.patch(`/column/move/${columnId}`, { position });
	},

	async reorderColumnsInBoard(
		boardId: string,
		columnIds: string[]
	): Promise<void> {
		await API.put(`/column/columns/reorder/${boardId}`, { columnIds });
	},

	async reorderCardsInList(
		boardId: string,
		listId: string,
		cardIds: string[]
	): Promise<void> {
		await API.put(
			`${KANBAN_ENDPOINT}/boards/${boardId}/columns/${listId}/reorder-cards`,
			{ cardIds }
		);
	},

	async moveCardBetweenLists(
		boardId: string,
		cardId: string,
		fromListId: string,
		toListId: string,
		newIndex: number
	): Promise<void> {
		await API.post(`${KANBAN_ENDPOINT}/boards/${boardId}/move-work-item`, {
			workItemId: cardId,
			fromColumnId: fromListId,
			toColumnId: toListId,
			position: newIndex,
		});
	},
};





