import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useDeleteKanbanBoardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			listId,
		}: {
			boardId: string;
			listId: string;
		}) => KanbanApiService.deleteKanbanBoardList(boardId, listId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'lists', variables.boardId],
			});
			// Also refresh the board to remove the deleted column from UI
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'board', variables.boardId],
			});
		},
		onSettled: (_, __, variables) => {
			// Ensure board cache removes the column (in case invalidation/refetch hasn't completed yet)
			try {
				queryClient.setQueryData(['Kanban', 'board', variables.boardId], (old: any) => {
					if (!old || !Array.isArray(old.columns)) return old;
					return { ...old, columns: old.columns.filter((c: any) => String(c._id || c) !== String(variables.listId)) };
				});
			} catch (err) {
				// ignore
			}
		},
	});
}





