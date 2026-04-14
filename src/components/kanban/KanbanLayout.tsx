import { useState } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { useCreateKanbanBoard } from '@/api/kanban/hooks/boards/useCreateKanbanBoard';
import { useNavigate, Outlet } from 'react-router-dom';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function KanbanLayout() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useKanbanAppContext();
  const { data: boards = [], isLoading } = useGetKanbanBoards();
  const { mutate: createBoard } = useCreateKanbanBoard();

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
          setNewBoardName('');
          setIsCreatingBoard(false);
          navigate(`/Kanban/boards/${board._id}`);
        },
      }
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-background">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Kanban</h1>
        </div>

        {/* Boards List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-gray-400 text-sm">Loading boards...</div>
            ) : boards.length > 0 ? (
              boards.map((board) => (
                <button
                  key={board._id}
                  onClick={() => navigate(`/Kanban/boards/${board._id}`)}
                  className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium text-sm">{board.name}</p>
                  <p className="text-xs text-gray-400">
                    {board.columns?.length || 0} lists
                  </p>
                </button>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No boards yet</div>
            )}
          </div>
        </div>

        {/* Create Board Section */}
        <div className="p-4 border-t border-gray-800">
          {isCreatingBoard ? (
            <div className="space-y-2">
              <Input
                placeholder="Board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBoard();
                  }
                }}
                autoFocus
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim()}
                  size="sm"
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingBoard(false);
                    setNewBoardName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsCreatingBoard(true)}
              className="w-full justify-start gap-2"
            >
              <Plus size={16} />
              New Board
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isSidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}





