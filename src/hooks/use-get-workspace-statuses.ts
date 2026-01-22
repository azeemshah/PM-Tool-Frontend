
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { useMemo } from 'react';

export function useGetWorkspaceStatuses(workspaceId: string) {
    // 1. Get boards for the workspace
    const { data: boards, isLoading: isLoadingBoards } = useGetKanbanBoards(workspaceId);

    // 2. Assume the first board is the main one (or the only one)
    const boardId = boards?.[0]?._id || null;

    // 3. Get lists (columns) for the board
    const { data: lists, isLoading: isLoadingLists } = useGetKanbanBoardLists(boardId);

    // 4. Compute statuses
    const statuses = useMemo(() => {
        if (!lists || lists.length === 0) {
            // Fallback to defaults if no dynamic lists found yet
            return [
                { label: 'Todo', value: 'todo' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'In Review', value: 'in_review' },
                { label: 'Done', value: 'done' }
            ];
        }

        // Map lists to status options
        // The value should be the column name (or normalized, but user wants column name)
        // My previous fix allowed column name as status.
        return lists.map((list) => ({
            label: list.name,
            value: list.name // Use name as value to match the column exactly
        }));
    }, [lists]);

    return {
        statuses,
        isLoading: isLoadingBoards || isLoadingLists,
        boardId
    };
}
