import { useState, useCallback } from 'react';
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
    if (typeof v === 'object') {
      if (v.$oid) return String(v.$oid);
      if (v.id) return String(v.id);
      if (v._id && typeof v._id === 'object' && v._id.$oid) return String(v._id.$oid);
      if (v._id && (typeof v._id === 'string' || typeof v._id === 'number')) return String(v._id);
      if (v._bsontype === 'ObjectID' && typeof v.toHexString === 'function') return String(v.toHexString());
    }
    return '';
  };
  const listIdNorm = normalizeId(list._id) || normalizeId(list.id) || '';
  const droppableIdSafe = listIdNorm || `list-${boardId}-${Math.abs(String(list.name || '').length)}`;

  const handleCreateCard = useCallback(() => {
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
      listId: listIdNorm || list._id,
      data: {
        title: cardTitle,
        description: '',
        board: boardId,
        column: listIdNorm || list._id,
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
  }, [cardTitle, boardId, list._id, listIdNorm, createCard]);

  // Get cards for this list
  const getCardsForList = useCallback(() => {
    const listIdNorm = normalizeId(list._id);
    try {
      console.log('BoardList debug', {
        droppableIdSafe,
        listIdNorm,
        cardsCount: (cards || []).length,
        listWorkItems: list?.workItems?.length || 0,
      });
    } catch (e) {
      // ignore
    }

    const cardsForList = (cards || []).filter((c: any) => {
      // card status/column may be in different fields depending on backend
      const statusId = normalizeId(c.status || c.column || c.columnId);
      // Match when normalized ids equal, or status string contains the list id
      return (
        (listIdNorm && statusId === listIdNorm) ||
        (listIdNorm && typeof statusId === 'string' && statusId.includes(listIdNorm))
      );
    });
    
    // CRITICAL FIX: Sort cards based on list's workItems array order
    // This ensures the UI respects the order stored in the backend
    if (list?.workItems && Array.isArray(list.workItems) && list.workItems.length > 0) {
      const workItemOrderMap = new Map(
        list.workItems.map((id: any, index: number) => [normalizeId(id), index])
      );
      
      cardsForList.sort((a: any, b: any) => {
        const cardAId = normalizeId(a._id) || normalizeId(a.id);
        const cardBId = normalizeId(b._id) || normalizeId(b.id);
        const orderA = workItemOrderMap.get(cardAId) ?? 999;
        const orderB = workItemOrderMap.get(cardBId) ?? 999;
        return orderA - orderB;
      });
      
      console.log('Sorted cards by workItems order:', cardsForList.map((c: any) => normalizeId(c._id) || normalizeId(c.id)));
    }
    
    // Deduplicate cards by id in case backend returns duplicates
    const uniqueCardsById = Array.from(
      new Map((cardsForList || []).map((c: any) => [normalizeId(c._id) || normalizeId(c.id) || Math.random(), c])).values(),
    );
    
    return uniqueCardsById;
  }, [cards, list, droppableIdSafe, normalizeId]);

  const cardsForThisList = getCardsForList();

  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex-1">
          {(() => {
            const rawName = (list && (list.name || list.title || list.label || '')) as any;
            const displayName = rawName && String(rawName).trim() ? String(rawName).trim() : 'Untitled';
            return <h3 className="font-semibold text-sm text-gray-900">{displayName}</h3>;
          })()}
          <p className="text-xs text-gray-500 mt-1">{cardsForThisList.length || 0} items</p>
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
          droppableId={droppableIdSafe}
          type="card"
          ignoreContainerClipping
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 space-y-2 min-h-[100px] transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              {cardsForThisList.length > 0 ? (
                cardsForThisList.map((card: any, index: number) => {
                  const cardIdSafe = normalizeId(card._id) || normalizeId(card.id) || `card-${index}-${droppableIdSafe}`;
                  return (
                    <Draggable key={cardIdSafe} draggableId={String(cardIdSafe)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onCardClick(card as ScrumboardCard)}
                          className={`transition-all ${snapshot.isDragging ? 'opacity-50 shadow-lg' : 'opacity-100'}`}
                        >
                          <BoardCard card={{ ...card, board: boardId, column: listIdNorm || list._id } as ScrumboardCard} />
                        </div>
                      )}
                    </Draggable>
                  );
                })
              ) : (
                <div className="text-gray-400 text-xs text-center py-4">No cards yet</div>
              )}
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
