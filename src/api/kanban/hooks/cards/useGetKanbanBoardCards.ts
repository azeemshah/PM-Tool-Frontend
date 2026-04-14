import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useGetKanbanBoardCards(boardId: string | null) {
	return useQuery({
		queryFn: () => KanbanApiService.getKanbanBoardCards(boardId!),
		queryKey: ['Kanban', 'cards', boardId],
		enabled: !!boardId,
		staleTime: 3 * 60 * 1000, // 3 minutes
	});
}





