import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApiService } from '../services/commentApiService';
import { UpdateCommentDto } from '../types';

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDto }) => 
      commentApiService.updateComment(id, data),
    onSuccess: (data) => {
      // We need to know the workItemId to invalidate efficiently, but it's not in the response wrapper usually
      // However, we can just invalidate all comments or assume we are in a context where we know.
      // Better: Return the comment and invalidate based on that if needed, or just invalidate 'comments'
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};
