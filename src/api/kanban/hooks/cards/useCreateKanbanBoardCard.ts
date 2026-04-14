import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { CreateCardDTO } from '../../types';

export function useCreateKanbanBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			listId,
			data,
		}: {
			boardId: string;
			listId: string;
			data: CreateCardDTO;
		}) => KanbanApiService.createKanbanBoardCard(boardId, listId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'cards', variables.boardId],
			});
		},
	});
}





