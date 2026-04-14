import { useQuery } from '@tanstack/react-query';
import { commentApiService } from '../services/commentApiService';

export const useGetComments = (workItemId: string) => {
  return useQuery({
    queryKey: ['comments', workItemId],
    queryFn: () => commentApiService.getCommentsByWorkItem(workItemId),
    enabled: !!workItemId,
  });
};
