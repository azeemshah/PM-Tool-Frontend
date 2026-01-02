import { useQuery } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useGetScrumboardBoardCards(boardId: string | null) {
	return useQuery({
		queryFn: () => scrumboardApiService.getScrumboardBoardCards(boardId!),
		queryKey: ['scrumboard', 'cards', boardId],
		enabled: !!boardId,
		staleTime: 3 * 60 * 1000, // 3 minutes
	});
}
