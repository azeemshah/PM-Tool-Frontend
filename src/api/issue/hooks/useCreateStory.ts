/**
 * Hook: useCreateStory
 * Create a new Story under Epic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateStoryDTO, Story } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateStory() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ epicId, data }: { epicId: string; data: CreateStoryDTO }) =>
			issueApiService.createStory(epicId, data),
		onSuccess: (story: Story) => {
			// Invalidate all related queries to refresh data across the app
			queryClient.invalidateQueries({ queryKey: ['stories'] });
			queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
			queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
			toast({
				title: 'Success',
				description: `Story "${story.title}" created successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to create story';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
