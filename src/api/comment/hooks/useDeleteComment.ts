import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApiService } from '../services/commentApiService';

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentApiService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};
