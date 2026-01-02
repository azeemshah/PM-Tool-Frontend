import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useDeleteScrumboardBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			cardId,
		}: {
			boardId: string;
			cardId: string;
		}) => scrumboardApiService.deleteScrumboardBoardCard(boardId, cardId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'cards', variables.boardId],
			});
		},
	});
}
