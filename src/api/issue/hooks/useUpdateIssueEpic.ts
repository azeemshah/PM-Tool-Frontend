/**
 * Hook: useUpdateIssueEpic
 * Update Epic for an existing Task/Story/Bug issue
 * This allows adding or changing Epic after the issue is created
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { UpdateIssueDTO } from '../types';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface ErrorResponse {
	message?: string;
}

export function useUpdateIssueEpic() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({ issueId, epicId }: { issueId: string; epicId: string | null }) =>
			issueApiService.updateIssue(issueId, { epicId: epicId || undefined } as UpdateIssueDTO),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['issues'] });
			queryClient.invalidateQueries({ queryKey: ['epic-children'] });
			queryClient.invalidateQueries({ queryKey: ['epics'] });
			toast({
				title: 'Success',
				description: `Issue Epic updated successfully`,
			});
		},
		onError: (error: AxiosError<ErrorResponse>) => {
			const message = error?.response?.data?.message || 'Failed to update issue epic';
			toast({
				title: 'Error',
				description: message,
				variant: 'destructive',
			});
		},
	});
}
