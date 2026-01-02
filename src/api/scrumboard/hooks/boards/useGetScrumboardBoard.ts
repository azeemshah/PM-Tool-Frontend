import { useQuery } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useGetScrumboardBoard(boardId: string | null) {
	return useQuery({
		queryFn: () => scrumboardApiService.getScrumboardBoard(boardId!),
		queryKey: ['scrumboard', 'board', boardId],
		enabled: !!boardId,
		staleTime: 5 * 60 * 1000,
	});
}
