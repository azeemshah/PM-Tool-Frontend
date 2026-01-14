import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { CreateListDTO } from '../../types';

export function useCreateKanbanBoardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: CreateListDTO;
		}) => KanbanApiService.createKanbanBoardList(boardId, data),
		onSuccess: (newColumn, variables) => {
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'lists', variables.boardId],
				});
				// Also refresh the board so the new column appears with its data
				queryClient.invalidateQueries({
					queryKey: ['Kanban', 'board', variables.boardId],
				});
				// Optimistically append the returned column object to the board cache
				try {
					queryClient.setQueryData(['Kanban', 'board', variables.boardId], (old: any) => {
						if (!old) return old;
						const cols = Array.isArray(old.columns) ? [...old.columns] : [];
						cols.push(newColumn);
						return { ...old, columns: cols };
					});
				} catch (err) {
					// ignore
				}
			},
	});
}





