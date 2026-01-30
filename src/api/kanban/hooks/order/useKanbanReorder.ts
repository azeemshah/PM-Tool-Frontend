import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useKanbanReorder(boardId: string | null) {
	const queryClient = useQueryClient();

	const reorderColumnMutation = useMutation({
		mutationFn: (columnIds: string[]) => {
			if (!boardId) return Promise.resolve();
			return KanbanApiService.reorderColumnsInBoard(boardId, columnIds);
		},
		onSuccess: () => {
			if (boardId) {
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'board', boardId],
				});
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'lists', boardId],
				});
			}
		},
	});

	const reorderCardMutation = useMutation({
		mutationFn: ({
			listId,
			cardIds,
		}: {
			listId: string;
			cardIds: string[];
		}) => {
			if (!boardId) return Promise.resolve();
			return KanbanApiService.reorderCardsInList(
				boardId,
				listId,
				cardIds
			);
		},
		onSuccess: async () => {
			if (boardId) {
				// Wait for react-beautiful-dnd animation to complete before refetching
				// This prevents visual glitches where data updates during drag animation
				await new Promise(resolve => setTimeout(resolve, 300));
				
				// CRITICAL: Refetch cards, lists, AND board to ensure full sync
				// Lists contain workItems array which determines card order
				// Board contains column info which affects rendering
				await Promise.all([
					queryClient.refetchQueries({
						queryKey: ['Kanban', 'cards', boardId],
					}),
					queryClient.refetchQueries({
						queryKey: ['Kanban', 'lists', boardId],
					}),
					queryClient.refetchQueries({
						queryKey: ['Kanban', 'board', boardId],
					}),
				]);
				console.log('✅ All queries refetched after reorder');
			}
		},
		onError: (error) => {
			console.error('❌ Reorder mutation error:', error);
		},
	});

	const moveCardMutation = useMutation({
		mutationFn: ({
			cardId,
			fromListId,
			toListId,
			newIndex,
		}: {
			cardId: string;
			fromListId: string;
			toListId: string;
			newIndex: number;
		}) => {
			if (!boardId) return Promise.resolve();
			return KanbanApiService.moveCardBetweenLists(
				boardId,
				cardId,
				fromListId,
				toListId,
				newIndex
			);
		},
		onSuccess: () => {
			if (boardId) {
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'cards', boardId],
				});
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'board', boardId],
				});
				queryClient.invalidateQueries({
					queryKey: ['history'],
				});
			}
		},
	});

	return {
		reorderColumn: (columnIds: string[]) => reorderColumnMutation.mutate(columnIds),
		reorderCard: (listId: string, cardIds: string[]) =>
			reorderCardMutation.mutate({ listId, cardIds }),
		moveCard: ({
			cardId,
			fromListId,
			toListId,
			newIndex,
		}: {
			cardId: string;
			fromListId: string;
			toListId: string;
			newIndex: number;
		}) =>
			moveCardMutation.mutate({
				cardId,
				fromListId,
				toListId,
				newIndex,
			}),
		isReorderingColumn: reorderColumnMutation.isPending,
		isReorderingCard: reorderCardMutation.isPending,
		isMovingCard: moveCardMutation.isPending,
	};
}





