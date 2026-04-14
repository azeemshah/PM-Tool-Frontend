import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApiService } from '../services/commentApiService';
import { CreateCommentDto } from '../types';

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => commentApiService.createComment(data),
    onSuccess: (data, variables) => {
      // Invalidate comments query for the specific work item
      queryClient.invalidateQueries({ queryKey: ['comments', variables.workItemId] });
      // Invalidate history to show the new comment activity
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
};
