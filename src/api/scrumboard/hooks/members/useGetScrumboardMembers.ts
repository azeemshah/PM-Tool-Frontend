import { useQuery } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useGetScrumboardMembers() {
	return useQuery({
		queryFn: () => scrumboardApiService.getScrumboardMembers(),
		queryKey: ['scrumboard', 'members'],
		staleTime: 30 * 60 * 1000, // 30 minutes - members change less frequently
	});
}
