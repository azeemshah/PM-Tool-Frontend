import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { CreateLabelDTO } from '../../types';

export function useCreateKanbanBoardLabel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: CreateLabelDTO;
		}) => KanbanApiService.createKanbanBoardLabel(boardId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'labels', variables.boardId],
			});
		},
	});
}





