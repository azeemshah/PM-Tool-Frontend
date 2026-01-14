import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { KanbanMember } from '../../types';

export function useUpdateKanbanMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			memberId,
			data,
		}: {
			memberId: string;
			data: Partial<KanbanMember>;
		}) => KanbanApiService.updateKanbanMember(memberId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'members'],
			});
		},
	});
}





