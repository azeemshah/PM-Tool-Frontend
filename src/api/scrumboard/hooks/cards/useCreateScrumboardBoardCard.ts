import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { CreateCardDTO } from '../../types';

export function useCreateScrumboardBoardCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			listId,
			data,
		}: {
			boardId: string;
			listId: string;
			data: CreateCardDTO;
		}) => scrumboardApiService.createScrumboardBoardCard(boardId, listId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'cards', variables.boardId],
			});
		},
	});
}
