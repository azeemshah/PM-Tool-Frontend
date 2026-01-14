import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';

export function useDeleteKanbanMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (memberId: string) =>
			KanbanApiService.deleteKanbanMember(memberId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'members'],
			});
		},
	});
}





