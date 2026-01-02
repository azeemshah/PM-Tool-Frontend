import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { UpdateListDTO } from '../../types';

export function useUpdateScrumboardBoardList() {
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
		}) => scrumboardApiService.updateScrumboardBoardList(boardId, listId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'lists', variables.boardId],
			});
		},
	});
}
