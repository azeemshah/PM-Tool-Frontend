import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useGetScrumboardBoards } from '@/api/scrumboard/hooks/boards/useGetScrumboardBoards';
import { useCreateScrumboardBoard } from '@/api/scrumboard/hooks/boards/useCreateScrumboardBoard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function BoardsView() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: boards = [], isLoading } = useGetScrumboardBoards();
  const { mutate: createBoard, isPending } = useCreateScrumboardBoard();
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;

    createBoard(
      {
        name: newBoardName,
        description: '',
      },
      {
        onSuccess: (board) => {
          console.log('Board created successfully:', board);
          setNewBoardName('');
          setIsCreatingBoard(false);
          if (board?._id) {
            navigate(`/workspace/${workspaceId}/boards/${board._id}`);
          } else {
            console.error('Board ID not found in response:', board);
            alert('Board created but navigation failed. Please refresh the page.');
          }
        },
        onError: (error) => {
          console.error('Error creating board:', error);
          // Derive a helpful message from different possible error shapes
          const extractedMessage =
            (error instanceof Error && error.message) ||
            (error && (error.response?.data?.message || error.response?.data || error.message)) ||
            (typeof error === 'string' ? error : null);

          alert('Failed to create board: ' + (extractedMessage ?? 'Unknown error'));
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Scrumboards</h1>
          <p className="text-gray-600">Manage your project boards and collaborate with your team</p>
        </div>

        {/* Create Board Button */}
        {isCreatingBoard ? (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Name
                </label>
                <Input
                  placeholder="Enter board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBoard();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateBoard}
                  disabled={isPending || !newBoardName.trim()}
                >
                  Create Board
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingBoard(false);
                    setNewBoardName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <Button onClick={() => setIsCreatingBoard(true)} className="flex items-center gap-2">
              <Plus size={20} />
              Create New Board
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading boards...</p>
          </div>
        )}

        {/* Boards Grid */}
        {!isLoading && boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => navigate(`/workspace/${workspaceId}/boards/${board._id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {board.name}
                    </h2>
                    {board.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex gap-4">
                      <div>
                        <span className="font-semibold text-gray-900">
                          {board.columns?.length || 0}
                        </span>
                        <span> lists</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          0
                        </span>
                        <span> items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && boards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No boards yet. Create your first board to get started!</p>
            <Button onClick={() => setIsCreatingBoard(true)} className="flex items-center gap-2 mx-auto">
              <Plus size={20} />
              Create Board
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
