import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { CreateBoardDTO } from '../../types';
import { scrumboardBoardsQueryKey } from './useGetScrumboardBoards';

export function useCreateScrumboardBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateBoardDTO) =>
			scrumboardApiService.createScrumboardBoard(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: scrumboardBoardsQueryKey,
			});
		},
	});
}
