import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useDeleteKanbanBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			cardId,
		}: {
			boardId: string;
			cardId: string;
		}) => KanbanApiService.deleteKanbanBoardCard(boardId, cardId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'cards', variables.boardId],
			});
		},
	});
}





