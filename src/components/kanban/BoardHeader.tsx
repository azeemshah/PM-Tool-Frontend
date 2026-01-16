import { useState } from 'react';
import { Plus, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { KanbanBoard } from '@/api/kanban/types';
import { useCreateKanbanBoardList } from '@/api/kanban/hooks/lists/useCreateKanbanBoardList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BoardHeaderProps {
  board: KanbanBoard;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [listName, setListName] = useState('');
  const { mutate: createList, isPending } = useCreateKanbanBoardList();

  const handleCreateList = () => {
    console.log('[BoardHeader] handleCreateList called', { listName, boardId: board._id });
    if (!listName.trim()) {
      console.log('[BoardHeader] listName is empty');
      return;
    }

    createList(
      {
        boardId: board._id,
        data: {
          name: listName,
          board: board._id,
        },
      },
      {
        onSuccess: () => {
          console.log('[BoardHeader] List created successfully');
          setListName('');
          setIsCreatingList(false);
        },
        onError: (err) => {
          console.error('[BoardHeader] Failed to create list', err);
        }
      }
    );
  };

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}/board`);
  };

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-0"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            {board.description && (
              <p className="mt-1 text-sm text-gray-500">{board.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCreatingList ? (
            <div className="flex gap-2">
              <Input
                placeholder="Status name..."
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateList();
                  }
                }}
                autoFocus
                className="w-40"
              />
              <Button
                onClick={handleCreateList}
                disabled={isPending || !listName.trim()}
                size="sm"
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreatingList(false);
                  setListName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingList(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Column
              </Button>
              <Button variant="outline" size="sm">
                <Settings size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}





