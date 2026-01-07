/**
 * Scrumboard API Service
 * تمام API calls یہاں ہیں
 */

import type {
	ScrumboardBoard,
	ScrumboardCard,
	ScrumboardList,
	ScrumboardLabel,
	ScrumboardMember,
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

export const scrumboardApiService = {
	// ==================== BOARDS ====================

	async getScrumboardBoards(): Promise<ScrumboardBoard[]> {
		try {
			const response = await API.get(`${KANBAN_ENDPOINT}/boards`);
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
			console.error('getScrumboardBoards error:', error);
			throw error;
		}
	},

	async getScrumboardBoard(boardId: string): Promise<ScrumboardBoard> {
		const response = await API.get(`${KANBAN_ENDPOINT}/boards/${boardId}`);
		return response.data.data || response.data;
	},

	async createScrumboardBoard(data: CreateBoardDTO): Promise<ScrumboardBoard> {
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
			console.error('createScrumboardBoard error:', error);
			throw error;
		}
	},

	async updateScrumboardBoard(
		boardId: string,
		data: UpdateBoardDTO
	): Promise<ScrumboardBoard> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}`, data);
		return response.data.data || response.data;
	},

	async deleteScrumboardBoard(boardId: string): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/boards/${boardId}`);
	},

	// ==================== LISTS ====================

	async getScrumboardBoardLists(boardId: string): Promise<ScrumboardList[]> {
		const response = await API.get(`${KANBAN_ENDPOINT}/boards/${boardId}/columns`);
		return response.data.data || response.data;
	},

	async createScrumboardBoardList(
		boardId: string,
		data: CreateListDTO
	): Promise<ScrumboardList> {
		const response = await API.post(`${KANBAN_ENDPOINT}/boards/${boardId}/columns`, data);
		return response.data.data || response.data;
	},

	async updateScrumboardBoardList(
		boardId: string,
		listId: string,
		data: UpdateListDTO
	): Promise<ScrumboardList> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}/columns/${listId}`, data);
		return response.data.data || response.data;
	},

	async deleteScrumboardBoardList(
		boardId: string,
		listId: string
	): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/boards/${boardId}/columns/${listId}`);
	},

	// ==================== CARDS ====================

	async getScrumboardBoardCards(boardId: string): Promise<ScrumboardCard[]> {
		console.log('API: getScrumboardBoardCards called for boardId', boardId);
		const response = await API.get(`${KANBAN_ENDPOINT}/items`);
		const items = response.data.data || response.data || [];
		console.log('API: getScrumboardBoardCards fetched items count', Array.isArray(items) ? items.length : 0);
		// NOTE: backend items may not include boardId; return all items
		// and let the UI filter by column/status where appropriate.
		console.log('API: getScrumboardBoardCards returning all items (UI will filter)');
		return items;
	},

	async createScrumboardBoardCard(
		boardId: string,
		listId: string,
		data: CreateCardDTO
	): Promise<ScrumboardCard> {
		console.log('API: createScrumboardBoardCard called', { boardId, listId, data });
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

	async updateScrumboardBoardCard(
		boardId: string,
		cardId: string,
		data: UpdateCardDTO
	): Promise<ScrumboardCard> {
		const response = await API.put(`${KANBAN_ENDPOINT}/items/${cardId}`, data);
		return response.data.data || response.data;
	},

	async deleteScrumboardBoardCard(
		boardId: string,
		cardId: string
	): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/items/${cardId}`);
	},

	// ==================== LABELS ====================

	async getScrumboardBoardLabels(boardId: string): Promise<ScrumboardLabel[]> {
		const response = await API.get(`${KANBAN_ENDPOINT}/boards/${boardId}/labels`);
		return response.data.data || response.data;
	},

	async createScrumboardBoardLabel(
		boardId: string,
		data: CreateLabelDTO
	): Promise<ScrumboardLabel> {
		const response = await API.post(`${KANBAN_ENDPOINT}/boards/${boardId}/labels`, data);
		return response.data.data || response.data;
	},

	async updateScrumboardBoardLabel(
		boardId: string,
		labelId: string,
		data: UpdateLabelDTO
	): Promise<ScrumboardLabel> {
		const response = await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}/labels/${labelId}`, data);
		return response.data.data || response.data;
	},

	async deleteScrumboardBoardLabel(
		boardId: string,
		labelId: string
	): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/boards/${boardId}/labels/${labelId}`);
	},

	// ==================== MEMBERS ====================

	async getScrumboardMembers(): Promise<ScrumboardMember[]> {
		const response = await API.get(`${KANBAN_ENDPOINT}/members`);
		return response.data.data || response.data;
	},

	async createScrumboardMember(
		data: Partial<ScrumboardMember>
	): Promise<ScrumboardMember> {
		const response = await API.post(`${KANBAN_ENDPOINT}/members`, data);
		return response.data.data || response.data;
	},

	async updateScrumboardMember(
		memberId: string,
		data: Partial<ScrumboardMember>
	): Promise<ScrumboardMember> {
		const response = await API.put(`${KANBAN_ENDPOINT}/members/${memberId}`, data);
		return response.data.data || response.data;
	},

	async deleteScrumboardMember(memberId: string): Promise<void> {
		await API.delete(`${KANBAN_ENDPOINT}/members/${memberId}`);
	},

	// ==================== REORDER ====================

	async reorderListsInBoard(
		boardId: string,
		listIds: string[]
	): Promise<void> {
		await API.put(`${KANBAN_ENDPOINT}/boards/${boardId}/reorder-lists`, { listIds });
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
