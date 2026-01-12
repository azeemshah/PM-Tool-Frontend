/**
 * Hook: useCreateEpic
 * Create a new Epic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateEpicDTO, Epic } from '../../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateEpic() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (data: CreateEpicDTO) => issueApiService.createEpic(data),
		onSuccess: (epic: Epic) => {
			// Invalidate all related queries to refresh data across the app
			queryClient.invalidateQueries({ queryKey: ['epics'], exact: false });
			queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['issues'], exact: false });
			queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
			queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
			toast({
				title: 'Success',
				description: `Epic "${epic.title}" created successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to create epic';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
