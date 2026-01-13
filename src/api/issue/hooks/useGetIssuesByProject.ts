import { useQuery } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { Issue } from '../types';

export function useGetIssuesByProject(projectId: string | null) {
	return useQuery<Issue[]>({
		queryKey: ['issues', 'project', projectId],
		queryFn: async () => {
			if (!projectId) return [];
			try {
				const response = await issueApiService.getIssuesByProject(projectId);
				const issues = response.data || response || [];
				return Array.isArray(issues) ? issues : [];
			} catch (error) {
				console.error('Error fetching issues by project:', error);
				return [];
			}
		},
		enabled: !!projectId,
		refetchOnWindowFocus: true,
	});
}
