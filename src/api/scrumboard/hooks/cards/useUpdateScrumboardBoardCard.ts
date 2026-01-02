import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { UpdateCardDTO } from '../../types';

export function useUpdateScrumboardBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			cardId,
			data,
		}: {
			boardId: string;
			cardId: string;
			data: UpdateCardDTO;
		}) => scrumboardApiService.updateScrumboardBoardCard(boardId, cardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'cards', variables.boardId],
			});
		},
	});
}
