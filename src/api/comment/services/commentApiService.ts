import API from '@/lib/axios-client';
import { Comment, CreateCommentDto, UpdateCommentDto } from '../types';

const COMMENTS_ENDPOINT = '/kanban/comments';

export const commentApiService = {
  // Create a new comment
  createComment: async (data: CreateCommentDto): Promise<Comment> => {
    const response = await API.post(COMMENTS_ENDPOINT, data);
    return response.data;
  },

  // Get comments by work item ID
  getCommentsByWorkItem: async (workItemId: string): Promise<Comment[]> => {
    const response = await API.get(`${COMMENTS_ENDPOINT}/work-item/${workItemId}`);
    return response.data;
  },

  // Update a comment
  updateComment: async (id: string, data: UpdateCommentDto): Promise<Comment> => {
    const response = await API.put(`${COMMENTS_ENDPOINT}/${id}`, data);
    return response.data;
  },

  // Delete a comment
  deleteComment: async (id: string): Promise<void> => {
    await API.delete(`${COMMENTS_ENDPOINT}/${id}`);
  },
};
