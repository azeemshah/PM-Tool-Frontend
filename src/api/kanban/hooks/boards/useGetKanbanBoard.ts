import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useGetKanbanBoard(boardId: string | null) {
	return useQuery({
		queryFn: () => KanbanApiService.getKanbanBoard(boardId!),
		queryKey: ['Kanban', 'board', boardId],
		enabled: !!boardId,
		staleTime: 5 * 60 * 1000,
	});
}





