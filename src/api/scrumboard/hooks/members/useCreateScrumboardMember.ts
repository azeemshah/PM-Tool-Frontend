import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { ScrumboardMember } from '../../types';

export function useCreateScrumboardMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<ScrumboardMember>) =>
			scrumboardApiService.createScrumboardMember(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'members'],
			});
		},
	});
}
