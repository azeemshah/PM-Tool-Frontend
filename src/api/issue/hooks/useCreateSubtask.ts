/**
 * Hook: useCreateSubtask
 * Create a new Subtask under Story/Task/Bug
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { CreateSubtaskDTO, Subtask } from '../../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateSubtask() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ parentIssueId, data }: { parentIssueId: string; data: CreateSubtaskDTO }) =>
			issueApiService.createSubtask(parentIssueId, data),
		onSuccess: (subtask: Subtask) => {
			queryClient.invalidateQueries({ queryKey: ['subtasks'] });
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			toast({
				title: 'Success',
				description: `Subtask "${subtask.title}" created successfully`,
			});
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || 'Failed to create subtask';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
