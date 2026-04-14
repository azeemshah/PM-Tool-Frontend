/**
 * Hook: useCreateTaskWithoutEpic
 * Create a new Task without Epic (Epic is optional, can be added later)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateTaskDTO, Task } from '../types';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface ErrorResponse {
	message?: string;
}

export function useCreateTaskWithoutEpic() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (data: CreateTaskDTO) =>
			issueApiService.createTaskWithoutEpic(data),
		onSuccess: (task: Task) => {
			// Invalidate all related queries to refresh data across the app
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
			queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
			queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
			queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
			toast({
				title: 'Success',
				description: `Task "${task.title}" created successfully`,
			});
		},
		onError: (error: AxiosError<ErrorResponse>) => {
			const message = error?.response?.data?.message || 'Failed to create task';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}





