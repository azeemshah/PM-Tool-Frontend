import { useQuery } from '@tanstack/react-query';
import { KanbanApiService } from '../../services/KanbanApiService';
import useWorkspaceId from '@/hooks/use-workspace-id';

export const KanbanBoardsQueryKey = ['kanban', 'boards'];

export function useGetKanbanBoards(workspaceId?: string) {
	const defaultWorkspaceId = useWorkspaceId();
	const finalWorkspaceId = workspaceId || defaultWorkspaceId;

	return useQuery({
		queryFn: () => KanbanApiService.getKanbanBoards(finalWorkspaceId),
		queryKey: [KanbanBoardsQueryKey, finalWorkspaceId],
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!finalWorkspaceId,
	});
}





