import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

type SprintStatusAction = 'start' | 'complete' | 'reopen';

export const useUpdateSprintStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Sprint, Error, { sprintId: string; workspaceId: string; action: SprintStatusAction }>({
    mutationFn: async ({ sprintId, action }) => {
      switch (action) {
        case 'start':
          return SprintApiService.startSprint(sprintId);
        case 'complete':
          return SprintApiService.completeSprint(sprintId);
        case 'reopen':
          return SprintApiService.reopenSprint(sprintId);
        default:
          throw new Error('Invalid sprint action');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', variables.workspaceId] });
    },
  });
};
