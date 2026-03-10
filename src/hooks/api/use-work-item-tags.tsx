import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface UseWorkItemTagsProps {
  workItemId: string;
  workspaceId: string;
}

export const useWorkItemTags = ({
  workItemId,
  workspaceId,
}: UseWorkItemTagsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Assign tags to work item
  const assignTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      const response = await axios.put(
        `${API_BASE_URL}/pm-kanban/work-items/${workItemId}`,
        { tags: tagIds },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["work-item", workItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace-items", workspaceId],
      });
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to update tags";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const assignTags = useCallback(
    async (tagIds: string[]) => {
      setIsLoading(true);
      try {
        await assignTagsMutation.mutateAsync(tagIds);
      } finally {
        setIsLoading(false);
      }
    },
    [assignTagsMutation],
  );

  const addTag = useCallback(
    async (currentTags: string[], newTagId: string) => {
      const updatedTags = [...new Set([...currentTags, newTagId])];
      return assignTags(updatedTags);
    },
    [assignTags],
  );

  const removeTag = useCallback(
    async (currentTags: string[], tagIdToRemove: string) => {
      const updatedTags = currentTags.filter((id) => id !== tagIdToRemove);
      return assignTags(updatedTags);
    },
    [assignTags],
  );

  return {
    assignTags,
    addTag,
    removeTag,
    isLoading,
    isPending: assignTagsMutation.isPending,
  };
};

export default useWorkItemTags;
