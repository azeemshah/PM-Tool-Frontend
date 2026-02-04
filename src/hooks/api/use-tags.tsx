import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/axios-client";

interface Tag {
  _id: string;
  name: string;
  workspaceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTagPayload {
  name: string;
  workspaceId: string;
}

interface UpdateTagPayload {
  name?: string;
}

export const useTags = () => {
  const queryClient = useQueryClient();

  // Get all tags by workspace
  const getAllTagsByWorkspace = (workspaceId: string) => {
    return useQuery({
      queryKey: ["tags", workspaceId],
      queryFn: async () => {
          const response = await API.get(`/kanban/tags/workspace/${workspaceId}`);
        return response.data;
      },
      enabled: !!workspaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Search tags (auto-suggest)
  const searchTags = (workspaceId: string, searchTerm: string, limit: number = 10) => {
    return useQuery({
      queryKey: ["tags-search", workspaceId, searchTerm],
      queryFn: async () => {
        const response = await API.get(`/kanban/tags/search/${workspaceId}`, {
          params: { q: searchTerm, limit },
        });
        return response.data;
      },
      enabled: !!workspaceId,
    });
  };

  // Get tag by ID
  const getTagById = (tagId: string) => {
    return useQuery({
      queryKey: ["tag", tagId],
      queryFn: async () => {
        const response = await API.get(`/kanban/tags/${tagId}`);
        return response.data;
      },
      enabled: !!tagId,
    });
  };

  // Get tags by IDs
  const getTagsByIds = (tagIds: string[]) => {
    return useQuery({
      queryKey: ["tags-batch", tagIds],
      queryFn: async () => {
        const response = await API.post(`/kanban/tags/batch/find`, {
          tagIds,
        });
        return response.data;
      },
      enabled: Array.isArray(tagIds) && tagIds.length > 0,
    });
  };

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (payload: CreateTagPayload) => {
      const response = await API.post(`/kanban/tags`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["tags", data.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tags-search"],
      });
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, payload }: { tagId: string; payload: UpdateTagPayload }) => {
      const response = await API.put(`/kanban/tags/${tagId}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["tag"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await API.delete(`/kanban/tags/${tagId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tags-search"],
      });
    },
  });

  // Check if tag exists
  const checkTagExists = (workspaceId: string, tagName: string) => {
    return useQuery({
      queryKey: ["tag-exists", workspaceId, tagName],
      queryFn: async () => {
          const response = await API.get(`/kanban/tags/check/${workspaceId}/${tagName}`);
        return response.data;
      },
      enabled: !!workspaceId && !!tagName,
    });
  };

  return {
    getAllTagsByWorkspace,
    searchTags,
    getTagById,
    getTagsByIds,
    createTag: createTagMutation,
    updateTag: updateTagMutation,
    deleteTag: deleteTagMutation,
    checkTagExists,
  };
};

export default useTags;
