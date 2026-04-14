import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { KanbanBoardsQueryKey } from './useGetKanbanBoards';

export function useDeleteKanbanBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (boardId: string) =>
			KanbanApiService.deleteKanbanBoard(boardId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: KanbanBoardsQueryKey,
			});
		},
	});
}





