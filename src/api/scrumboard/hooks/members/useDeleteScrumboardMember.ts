import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';

export function useDeleteScrumboardMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (memberId: string) =>
			scrumboardApiService.deleteScrumboardMember(memberId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'members'],
			});
		},
	});
}
