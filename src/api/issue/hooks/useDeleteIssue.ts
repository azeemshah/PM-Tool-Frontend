/**
 * Hook: useDeleteIssue
 * Delete any Issue (Epic, Story, Task, Bug, Subtask)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { useToast } from '@/hooks/use-toast';

export function useDeleteIssue() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (issueId: string) => issueApiService.deleteIssue(issueId),
		onSuccess: () => {
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
				description: 'Issue deleted successfully',
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to delete issue';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}





