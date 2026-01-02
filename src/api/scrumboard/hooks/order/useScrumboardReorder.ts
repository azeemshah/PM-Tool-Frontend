import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useScrumboardReorder(boardId: string | null) {
	const queryClient = useQueryClient();

	const reorderListMutation = useMutation({
		mutationFn: (listIds: string[]) => {
			if (!boardId) return Promise.resolve();
			return scrumboardApiService.reorderListsInBoard(boardId, listIds);
		},
		onSuccess: () => {
			if (boardId) {
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'board', boardId],
				});
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'lists', boardId],
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
			return scrumboardApiService.reorderCardsInList(
				boardId,
				listId,
				cardIds
			);
		},
		onSuccess: () => {
			if (boardId) {
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'cards', boardId],
				});
			}
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
			return scrumboardApiService.moveCardBetweenLists(
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
					queryKey: ['scrumboard', 'cards', boardId],
				});
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'board', boardId],
				});
			}
		},
	});

	return {
		reorderList: (listIds: string[]) => reorderListMutation.mutate(listIds),
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
		isReorderingList: reorderListMutation.isPending,
		isReorderingCard: reorderCardMutation.isPending,
		isMovingCard: moveCardMutation.isPending,
	};
}
