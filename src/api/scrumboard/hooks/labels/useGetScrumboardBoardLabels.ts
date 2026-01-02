import { useQuery } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useGetScrumboardBoardLabels(boardId: string | null) {
	return useQuery({
		queryFn: () => scrumboardApiService.getScrumboardBoardLabels(boardId!),
		queryKey: ['scrumboard', 'labels', boardId],
		enabled: !!boardId,
		staleTime: 10 * 60 * 1000, // 10 minutes - labels change less frequently
	});
}
