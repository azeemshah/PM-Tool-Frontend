import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { Sprint } from '../../types';

export const useEditSprint = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Sprint,
    Error,
    { sprintId: string; workspaceId: string; data: Partial<{ name: string; goal?: string; startDate: string; endDate: string }> }
  >({
    mutationFn: ({ sprintId, data }) => SprintApiService.updateSprintDetails(sprintId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.workspaceId] });
    },
  });
};
