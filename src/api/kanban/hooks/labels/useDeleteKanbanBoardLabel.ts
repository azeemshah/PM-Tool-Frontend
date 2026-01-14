import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useDeleteKanbanBoardLabel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			labelId,
		}: {
			boardId: string;
			labelId: string;
		}) => KanbanApiService.deleteKanbanBoardLabel(boardId, labelId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'labels', variables.boardId],
			});
		},
	});
}





