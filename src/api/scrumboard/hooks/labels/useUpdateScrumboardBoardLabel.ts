import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { UpdateLabelDTO } from '../../types';

export function useUpdateScrumboardBoardLabel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			labelId,
			data,
		}: {
			boardId: string;
			labelId: string;
			data: UpdateLabelDTO;
		}) => scrumboardApiService.updateScrumboardBoardLabel(boardId, labelId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'labels', variables.boardId],
			});
		},
	});
}
