import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

type UpdateBody = Partial<{ name: string; goal?: string; startDate: string; endDate: string }>;

export const useUpdateSprint = (workspaceId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<Sprint, Error, { sprintId: string; body: UpdateBody }>({
    mutationFn: ({ sprintId, body }) => SprintApiService.updateSprintDetails(sprintId, body),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['sprints', workspaceId] });
      }
    },
  });
};
