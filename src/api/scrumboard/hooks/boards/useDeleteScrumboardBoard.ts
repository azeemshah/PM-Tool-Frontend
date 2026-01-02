import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { scrumboardBoardsQueryKey } from './useGetScrumboardBoards';

export function useDeleteScrumboardBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (boardId: string) =>
			scrumboardApiService.deleteScrumboardBoard(boardId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: scrumboardBoardsQueryKey,
			});
		},
	});
}
