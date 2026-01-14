/**
 * Hook: useGetEpicChildren
 * Fetch Story/Task/Bug children under Epic
 */

import { useQuery } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { Story, Task, Bug } from '../types';

export function useGetEpicChildren(epicId: string | null) {
	return useQuery({
		queryKey: ['epic-children', epicId],
		queryFn: async () => {
			if (!epicId) return [];
			return issueApiService.getEpicChildren(epicId);
		},
		enabled: !!epicId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
