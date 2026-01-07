/**
 * Hook: useCreateTask
 * Create a new Task under Epic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateTaskDTO, Task } from '../../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateTask() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ epicId, data }: { epicId: string; data: CreateTaskDTO }) =>
			issueApiService.createTask(epicId, data),
		onSuccess: (task: Task) => {
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			toast({
				title: 'Success',
				description: `Task "${task.title}" created successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to create task';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
