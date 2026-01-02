import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { UpdateBoardDTO } from '../../types';

export function useUpdateScrumboardBoard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: UpdateBoardDTO;
		}) => scrumboardApiService.updateScrumboardBoard(boardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'board', variables.boardId],
			});
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'boards'],
			});
		},
	});
}
