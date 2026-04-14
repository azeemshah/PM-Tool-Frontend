import { useNavigate, useParams } from 'react-router-dom';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { useEffect } from 'react';

export function BoardsView() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: boards = [], isLoading, error } = useGetKanbanBoards();

  // Debug logging
  useEffect(() => {
    console.log('BoardsView - boards:', boards, 'isLoading:', isLoading, 'error:', error);
  }, [boards, isLoading, error]);

  // Auto-navigate to first board or show loading
  useEffect(() => {
    if (!isLoading) {
      if (boards && boards.length > 0 && workspaceId) {
        const firstBoard = boards[0];
        console.log('Auto-navigating to first board:', firstBoard);
        if (firstBoard?._id) {
          navigate(`/workspace/${workspaceId}/boards/${firstBoard._id}`);
        }
      } else if (error) {
        console.error('Error loading boards:', error);
      }
    }
  }, [boards, isLoading, workspaceId, navigate, error]);

  // Show loading state while fetching boards
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading board</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // If no boards found
  if (!boards || boards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">No board available. Please contact administrator.</p>
        </div>
      </div>
    );
  }

  // Loading state while navigating
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading board...</p>
      </div>
    </div>
  );
}





