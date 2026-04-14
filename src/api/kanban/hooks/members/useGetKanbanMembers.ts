import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useGetKanbanMembers() {
	return useQuery({
		queryFn: () => KanbanApiService.getKanbanMembers(),
		queryKey: ['Kanban', 'members'],
		staleTime: 30 * 60 * 1000, // 30 minutes - members change less frequently
	});
}





