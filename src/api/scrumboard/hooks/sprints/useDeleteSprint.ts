import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; sprintId: string },
    Error,
    { sprintId: string; workspaceId: string }
  >({
    mutationFn: ({ sprintId }) => SprintApiService.deleteSprint(sprintId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', variables.workspaceId] });
    },
  });
};
