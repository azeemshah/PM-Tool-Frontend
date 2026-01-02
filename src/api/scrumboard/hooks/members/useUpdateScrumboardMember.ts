import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrumboardApiService } from '../../services/scrumboardApiService';
import { ScrumboardMember } from '../../types';

export function useUpdateScrumboardMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			memberId,
			data,
		}: {
			memberId: string;
			data: Partial<ScrumboardMember>;
		}) => scrumboardApiService.updateScrumboardMember(memberId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['scrumboard', 'members'],
			});
		},
	});
}
