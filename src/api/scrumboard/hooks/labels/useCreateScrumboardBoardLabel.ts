import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { CreateLabelDTO } from '../../types';

export function useCreateScrumboardBoardLabel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: CreateLabelDTO;
		}) => scrumboardApiService.createScrumboardBoardLabel(boardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'labels', variables.boardId],
			});
		},
	});
}
