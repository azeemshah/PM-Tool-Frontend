import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useGetKanbanBoardLists(boardId: string | null) {
	return useQuery({
		queryFn: () => KanbanApiService.getKanbanBoardLists(boardId!),
		queryKey: ['Kanban', 'lists', boardId],
		enabled: !!boardId,
		staleTime: 5 * 60 * 1000,
	});
}





