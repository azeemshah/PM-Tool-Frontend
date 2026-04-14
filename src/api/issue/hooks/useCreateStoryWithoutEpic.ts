/**
 * Hook: useCreateStoryWithoutEpic
 * Create a new Story without Epic (Epic is optional, can be added later)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateStoryDTO, Story } from '../types';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface ErrorResponse {
	message?: string;
}

export function useCreateStoryWithoutEpic() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (data: CreateStoryDTO) =>
			issueApiService.createStoryWithoutEpic(data),
		onSuccess: (story: Story) => {
			queryClient.invalidateQueries({ queryKey: ['stories'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
			toast({
				title: 'Success',
				description: `Story "${story.title}" created successfully`,
			});
		},
		onError: (error: AxiosError<ErrorResponse>) => {
			const message = error?.response?.data?.message || 'Failed to create story';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}





