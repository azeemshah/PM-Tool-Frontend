import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { UpdateListDTO } from '../../types';

export function useUpdateKanbanBoardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			listId,
			data,
		}: {
			boardId: string;
			listId: string;
			data: UpdateListDTO;
		}) => KanbanApiService.updateKanbanBoardList(boardId, listId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'lists', variables.boardId],
			});
		},
	});
}





