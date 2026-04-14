import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useGetKanbanBoardLabels(boardId: string | null) {
	return useQuery({
		queryFn: () => KanbanApiService.getKanbanBoardLabels(boardId!),
		queryKey: ['Kanban', 'labels', boardId],
		enabled: !!boardId,
		staleTime: 10 * 60 * 1000, // 10 minutes - labels change less frequently
	});
}





