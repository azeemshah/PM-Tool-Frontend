import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

type SprintAction = 'start' | 'complete' | 'reopen';

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Sprint,
    Error,
    { sprintId: string; action: SprintAction; workspaceId: string }
  >({
    mutationFn: ({ sprintId, action }) => {
      switch (action) {
        case 'start':
          return SprintApiService.startSprint(sprintId);
        case 'complete':
          return SprintApiService.completeSprint(sprintId);
        case 'reopen':
          return SprintApiService.reopenSprint(sprintId);
        default:
          throw new Error(`Unknown sprint action: ${action}`);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch sprints for the workspace
      queryClient.invalidateQueries({
        queryKey: ['sprints', data.workspaceId]
      });
    },
  });
};