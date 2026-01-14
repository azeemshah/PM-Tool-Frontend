import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import { KanbanMember } from '../../types';

export function useCreateKanbanMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<KanbanMember>) =>
			KanbanApiService.createKanbanMember(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['Kanban', 'members'],
			});
		},
	});
}





