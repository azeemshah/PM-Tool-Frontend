import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';

export const useAddWorkItemsToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { sprintId: string; workItemIds: string[]; workspaceId: string }
  >({
    mutationFn: ({ sprintId, workItemIds }) =>
      SprintApiService.addWorkItemsToSprint(sprintId, workItemIds),
    onSuccess: (_, variables) => {
      // Invalidate and refetch sprints for the workspace
      queryClient.invalidateQueries({
        queryKey: ['sprints', variables.workspaceId]
      });
      // Also invalidate work items to reflect status changes
      queryClient.invalidateQueries({
        queryKey: ['work-items']
      });
    },
  });
};