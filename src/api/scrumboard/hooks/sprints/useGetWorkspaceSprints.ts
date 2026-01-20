import { useQuery } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

export const useGetWorkspaceSprints = (workspaceId: string) => {
  return useQuery<Sprint[]>({
    queryKey: ['sprints', workspaceId],
    queryFn: () => SprintApiService.getWorkspaceSprints(workspaceId),
    enabled: !!workspaceId,
  });
};