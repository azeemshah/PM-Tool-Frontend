/**
 * Hook: useCreateBug
 * Create a new Bug under Epic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateBugDTO, Bug } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateBug() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ epicId, data }: { epicId: string; data: CreateBugDTO }) =>
			issueApiService.createBug(epicId, data),
		onSuccess: (bug: Bug) => {
			// Invalidate all related queries to refresh data across the app
			queryClient.invalidateQueries({ queryKey: ['bugs'] });
			queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
			queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
			toast({
				title: 'Success',
				description: `Bug "${bug.title}" created successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to create bug';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
