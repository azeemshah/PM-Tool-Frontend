import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { CreateListDTO } from '../../types';

export function useCreateScrumboardBoardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			boardId,
			data,
		}: {
			boardId: string;
			data: CreateListDTO;
		}) => scrumboardApiService.createScrumboardBoardList(boardId, data),
		onSuccess: (newColumn, variables) => {
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'lists', variables.boardId],
				});
				// Also refresh the board so the new column appears with its data
				queryClient.invalidateQueries({
					queryKey: ['scrumboard', 'board', variables.boardId],
				});
				// Optimistically append the returned column object to the board cache
				try {
					queryClient.setQueryData(['scrumboard', 'board', variables.boardId], (old: any) => {
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
