/**
 * Hook: useGetSubtasks
 * Fetch Subtasks under a parent (Story/Task/Bug)
 */

import { useQuery } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { Subtask } from '../types';

export function useGetSubtasks(parentIssueId: string | null) {
	return useQuery({
		queryKey: ['subtasks', parentIssueId],
		queryFn: async () => {
			if (!parentIssueId) return [];
			return issueApiService.getSubtasks(parentIssueId);
		},
		enabled: !!parentIssueId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}





