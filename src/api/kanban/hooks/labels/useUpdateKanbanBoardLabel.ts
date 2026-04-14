import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { UpdateLabelDTO } from '../../types';

export function useUpdateKanbanBoardLabel() {
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
		}) => KanbanApiService.updateKanbanBoardLabel(boardId, labelId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'labels', variables.boardId],
			});
		},
	});
}





