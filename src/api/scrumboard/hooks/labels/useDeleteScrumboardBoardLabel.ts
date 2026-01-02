import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useDeleteScrumboardBoardLabel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			labelId,
		}: {
			boardId: string;
			labelId: string;
		}) => scrumboardApiService.deleteScrumboardBoardLabel(boardId, labelId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'labels', variables.boardId],
			});
		},
	});
}
