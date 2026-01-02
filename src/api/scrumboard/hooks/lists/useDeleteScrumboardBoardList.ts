import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useDeleteScrumboardBoardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			listId,
		}: {
			boardId: string;
			listId: string;
		}) => scrumboardApiService.deleteScrumboardBoardList(boardId, listId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'lists', variables.boardId],
			});
			// Also refresh the board to remove the deleted column from UI
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'board', variables.boardId],
			});
		},
		onSettled: (_, __, variables) => {
			// Ensure board cache removes the column (in case invalidation/refetch hasn't completed yet)
			try {
				queryClient.setQueryData(['scrumboard', 'board', variables.boardId], (old: any) => {
					if (!old || !Array.isArray(old.columns)) return old;
					return { ...old, columns: old.columns.filter((c: any) => String(c._id || c) !== String(variables.listId)) };
				});
			} catch (err) {
				// ignore
			}
		},
	});
}
