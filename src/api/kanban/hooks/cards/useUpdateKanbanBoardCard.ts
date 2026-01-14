import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { UpdateCardDTO } from '../../types';

export function useUpdateKanbanBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			cardId,
			data,
		}: {
			boardId: string;
			cardId: string;
			data: UpdateCardDTO;
		}) => KanbanApiService.updateKanbanBoardCard(boardId, cardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'cards', variables.boardId],
			});
		},
	});
}





