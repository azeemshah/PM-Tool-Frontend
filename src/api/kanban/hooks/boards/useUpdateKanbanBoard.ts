import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { UpdateBoardDTO } from '../../types';

export function useUpdateKanbanBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: UpdateBoardDTO;
		}) => KanbanApiService.updateKanbanBoard(boardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'board', variables.boardId],
			});
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'boards'],
			});
		},
	});
}





