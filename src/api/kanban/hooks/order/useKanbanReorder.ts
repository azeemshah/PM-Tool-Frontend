import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanApiService } from "../../services/KanbanApiService";
import { useToast } from "@/hooks/use-toast";

export function useKanbanReorder(boardId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reorderColumnMutation = useMutation({
    mutationFn: (columnIds: string[]) => {
      if (!boardId) return Promise.resolve();
      return KanbanApiService.reorderColumnsInBoard(boardId, columnIds);
    },
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: ["Kanban", "board", boardId],
        });
        queryClient.invalidateQueries({
          queryKey: ["Kanban", "lists", boardId],
        });
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to reorder columns";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const reorderCardMutation = useMutation({
    mutationFn: ({
      listId,
      cardIds,
    }: {
      listId: string;
      cardIds: string[];
    }) => {
      if (!boardId) return Promise.resolve();
      return KanbanApiService.reorderCardsInList(boardId, listId, cardIds);
    },
    onSuccess: async () => {
      if (boardId) {
        // Wait for react-beautiful-dnd animation to complete before refetching
        // This prevents visual glitches where data updates during drag animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // CRITICAL: Refetch cards, lists, AND board to ensure full sync
        // Lists contain workItems array which determines card order
        // Board contains column info which affects rendering
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: ["Kanban", "cards", boardId],
          }),
          queryClient.refetchQueries({
            queryKey: ["Kanban", "lists", boardId],
          }),
          queryClient.refetchQueries({
            queryKey: ["Kanban", "board", boardId],
          }),
        ]);
        console.log("✅ All queries refetched after reorder");
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to reorder cards";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: ({
      cardId,
      fromListId,
      toListId,
      newIndex,
    }: {
      cardId: string;
      fromListId: string;
      toListId: string;
      newIndex: number;
    }) => {
      if (!boardId) return Promise.resolve();
      return KanbanApiService.moveCardBetweenLists(
        boardId,
        cardId,
        fromListId,
        toListId,
        newIndex,
      );
    },
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: ["Kanban", "cards", boardId],
        });
        queryClient.invalidateQueries({
          queryKey: ["Kanban", "board", boardId],
        });
        queryClient.invalidateQueries({
          queryKey: ["history"],
        });
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to move card";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  return {
    reorderColumn: (columnIds: string[]) =>
      reorderColumnMutation.mutate(columnIds),
    reorderCard: (listId: string, cardIds: string[]) =>
      reorderCardMutation.mutate({ listId, cardIds }),
    moveCard: ({
      cardId,
      fromListId,
      toListId,
      newIndex,
    }: {
      cardId: string;
      fromListId: string;
      toListId: string;
      newIndex: number;
    }) =>
      moveCardMutation.mutate({
        cardId,
        fromListId,
        toListId,
        newIndex,
      }),
    isReorderingColumn: reorderColumnMutation.isPending,
    isReorderingCard: reorderCardMutation.isPending,
    isMovingCard: moveCardMutation.isPending,
  };
}
