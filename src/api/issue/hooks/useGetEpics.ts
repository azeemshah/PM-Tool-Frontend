/**
 * Hook: useGetEpics
 * Fetch all Epics in a project
 */

import { useQuery } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { Epic } from '../../types';

export function useGetEpics(projectId: string | null) {
	return useQuery({
		queryKey: ['epics', projectId],
		queryFn: async () => {
			if (!projectId) return [];
			return issueApiService.getEpicsByProject(projectId);
		},
		enabled: !!projectId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
