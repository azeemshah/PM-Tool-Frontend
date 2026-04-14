/**
 * Hook: useUpdateIssue
 * Update any Issue (Epic, Story, Task, Bug, Subtask)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { UpdateIssueDTO, Issue } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useUpdateIssue() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ issueId, data }: { issueId: string; data: UpdateIssueDTO }) =>
			issueApiService.updateIssue(issueId, data),
		onSuccess: (issue: Issue) => {
			queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['epics'] });
			queryClient.invalidateQueries({ queryKey: ['stories'] });
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
			queryClient.invalidateQueries({ queryKey: ['bugs'] });
			queryClient.invalidateQueries({ queryKey: ['subtasks'] });
			queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
			queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
			queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
			toast({
				title: 'Success',
				description: `Issue updated successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to update issue';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}





