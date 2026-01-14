import { Suspense } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BoardsView } from '@/components/kanban/views/BoardsView';
import { KanbanBoardView } from '@/components/kanban/KanbanBoardView';
import { KanbanAppContextProvider } from '@/contexts/KanbanAppContext';
import ScrumBoardView from '@/components/scrumboard/ScrumBoardView';
import useWorkspaceId from '@/hooks/use-workspace-id';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId?: string }>();
  const workspaceId = useWorkspaceId();

  // Fetch workspace to get board type
  const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspace/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();
      return data.workspace;
    },
  });

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading Board...</p>
      </div>
    </div>
  );

  if (isWorkspaceLoading) {
    return <LoadingFallback />;
  }

  const boardType = workspace?.boardType || 'kanban';

  // Render Kanban board
  if (boardType === 'kanban') {
    return (
      <div className="w-full h-full">
        <ErrorBoundary>
          <KanbanAppContextProvider>
            <Suspense fallback={<LoadingFallback />}>
              {boardId ? <KanbanBoardView /> : <BoardsView />}
            </Suspense>
          </KanbanAppContextProvider>
        </ErrorBoundary>
      </div>
    );
  }

  // Render Scrum board
  if (boardType === 'scrumboard') {
    return (
      <div className="w-full h-full">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ScrumBoardView />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <KanbanAppContextProvider>
          <Suspense fallback={<LoadingFallback />}>
            {boardId ? <KanbanBoardView /> : <BoardsView />}
          </Suspense>
        </KanbanAppContextProvider>
      </ErrorBoundary>
    </div>
  );
};

export default BoardPage;





