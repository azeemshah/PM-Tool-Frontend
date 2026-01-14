import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { CreateBoardDTO } from '../../types';
import { KanbanBoardsQueryKey } from './useGetKanbanBoards';

export function useCreateKanbanBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateBoardDTO) =>
			KanbanApiService.createKanbanBoard(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: KanbanBoardsQueryKey,
			});
		},
	});
}





