import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

type SprintStatusAction = 'start' | 'complete' | 'reopen';

interface UpdateSprintStatusParams {
  sprintId: string;
  workspaceId: string;
  action: SprintStatusAction;
  targetSprintId?: string;
}

export const useUpdateSprintStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Sprint, Error, UpdateSprintStatusParams>({
    mutationFn: async ({ sprintId, action, targetSprintId }) => {
      switch (action) {
        case 'start':
          return SprintApiService.startSprint(sprintId);
        case 'complete':
          return SprintApiService.completeSprint(sprintId, targetSprintId);
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
