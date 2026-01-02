import { useQuery } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useGetScrumboardBoardLists(boardId: string | null) {
	return useQuery({
		queryFn: () => scrumboardApiService.getScrumboardBoardLists(boardId!),
		queryKey: ['scrumboard', 'lists', boardId],
		enabled: !!boardId,
		staleTime: 5 * 60 * 1000,
	});
}
