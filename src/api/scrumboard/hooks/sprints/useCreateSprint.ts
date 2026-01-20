import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintApiService } from '../../services/SprintApiService';
import { CreateSprintDto, Sprint } from '../../types';

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation<Sprint, Error, CreateSprintDto>({
    mutationFn: SprintApiService.createSprint,
    onSuccess: (data) => {
      // Invalidate and refetch sprints for the workspace
      queryClient.invalidateQueries({
        queryKey: ['sprints', data.workspaceId]
      });
    },
  });
};