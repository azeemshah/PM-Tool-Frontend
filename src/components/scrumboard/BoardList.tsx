import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { ScrumboardList, ScrumboardCard } from '@/api/scrumboard/types';
import { useCreateScrumboardBoardCard } from '@/api/scrumboard/hooks/cards/useCreateScrumboardBoardCard';
import { useGetScrumboardBoardCards } from '@/api/scrumboard/hooks/cards/useGetScrumboardBoardCards';
import { useDeleteScrumboardBoardList } from '@/api/scrumboard/hooks/lists/useDeleteScrumboardBoardList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BoardCard } from './BoardCard';

interface BoardListProps {
  list: ScrumboardList;
  boardId: string;
  onCardClick: (card: ScrumboardCard) => void;
}

export function BoardList({ list, boardId, onCardClick }: BoardListProps) {
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const { mutate: createCard, isPending: isCreatingCardLoading } =
    useCreateScrumboardBoardCard();
  const { mutate: deleteList } = useDeleteScrumboardBoardList();

  const { data: cards } = useGetScrumboardBoardCards(boardId);

  const normalizeId = (v: any) => {
    if (!v) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (v._id) return String(v._id);
    if (v.id) return String(v.id);
    if (v.$oid) return String(v.$oid);
    return '';
  };

  const handleCreateCard = () => {
    console.log('handleCreateCard called');
    console.log('cardTitle:', cardTitle);
    console.log('boardId:', boardId);
    console.log('listId:', list._id);
    
    if (!cardTitle.trim()) {
      console.warn('Card title is empty');
      return;
    }

    const payload = {
      boardId,
      listId: list._id,
      data: {
        title: cardTitle,
        description: '',
        board: boardId,
        column: list._id,
      },
    };

    console.log('Creating card with payload:', payload);

    createCard(payload, {
      onSuccess: (response) => {
        console.log('Card created successfully:', response);
        setCardTitle('');
        setIsCreatingCard(false);
      },
      onError: (error) => {
        console.error('Card creation failed:', error);
      },
    });
  };

  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900">{(list.name && String(list.name).trim()) || (list.title && String(list.title).trim()) || 'Untitled'}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {(list.workItems?.length ?? list.cards?.length ?? 0)} items
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteList({ boardId, listId: list._id })}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto">
        <Droppable
          droppableId={list._id}
          type="card"
          ignoreContainerClipping
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 space-y-2 ${
                snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              {
                // Prefer showing cards from the cards query (backend may not update column.workItems)
                (() => {
                  const listIdNorm = normalizeId(list._id);
                  // Debug: show normalized list id and some card statuses
                  try {
                    console.log('BoardList: listIdNorm', listIdNorm);
                    console.log('BoardList: cards statuses sample', (cards || []).slice(0, 10).map((c: any) => normalizeId(c.status)));
                    console.log('BoardList: cards ids sample', (cards || []).slice(0, 10).map((c: any) => normalizeId(c._id)));
                  } catch (e) {
                    // ignore
                  }

                  const cardsForList = (cards || []).filter((c: any) => {
                    const statusId = normalizeId(c.status);
                    // Match when normalized ids equal, or status string contains the list id
                    return (
                      statusId === listIdNorm ||
                      (typeof statusId === 'string' && statusId.includes(listIdNorm)) ||
                      normalizeId(c.board) === listIdNorm ||
                      normalizeId(c.boardId) === listIdNorm
                    );
                  });
                  if (cardsForList.length > 0) {
                    return cardsForList.map((card: any, index: number) => (
                      <Draggable key={card._id} draggableId={String(card._id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onCardClick(card as ScrumboardCard)}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <BoardCard card={{ ...card, board: boardId, column: list._id } as ScrumboardCard} />
                          </div>
                        )}
                      </Draggable>
                    ));
                  }

                  // Fallback to legacy list.workItems array
                  if (list.workItems && list.workItems.length > 0) {
                    return list.workItems.map((cardId: any, index: number) => (
                      <Draggable key={cardId} draggableId={String(cardId)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => {
                              const card = { _id: cardId } as ScrumboardCard;
                              onCardClick(card);
                            }}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <BoardCard card={{ _id: cardId, board: boardId, column: list._id, title: 'Loading...' } as ScrumboardCard} />
                          </div>
                        )}
                      </Draggable>
                    ));
                  }

                  return (
                    <div className="text-gray-400 text-xs text-center py-4">No cards yet</div>
                  );
                })()
              }
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* Add Card Button */}
      <div className="border-t p-3">
        {isCreatingCard ? (
          <div className="space-y-2">
            <Input
              placeholder="Card title..."
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCard();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={(e) => {
                  console.log('Add button clicked', e);
                  handleCreateCard();
                }}
                disabled={isCreatingCardLoading || !cardTitle.trim()}
                size="sm"
                className="flex-1"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreatingCard(false);
                  setCardTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCreatingCard(true)}
            className="w-full justify-start text-gray-600 hover:bg-gray-50"
          >
            <Plus size={14} />
            <span className="ml-2">Add card</span>
          </Button>
        )}
      </div>
    </div>
  );
}
