import { useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams } from 'react-router-dom';
import { useGetScrumboardBoard } from '@/api/scrumboard/hooks/boards/useGetScrumboardBoard';
import { useGetScrumboardBoardLists } from '@/api/scrumboard/hooks/lists/useGetScrumboardBoardLists';
import { useScrumboardReorder } from '@/api/scrumboard/hooks/order/useScrumboardReorder';
import { useScrumboardAppContext } from '@/contexts/ScrumboardAppContext';
import { BoardHeader } from './BoardHeader';
import { BoardList } from './BoardList';
import { BoardCardDialog } from './dialogs/BoardCardDialog';

export function ScrumboardBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, error } = useGetScrumboardBoard(boardId || '');
  const { data: lists } = useGetScrumboardBoardLists(boardId || null);
  const { setSelectedBoard, setSelectedCard, setIsCardDialogOpen } = useScrumboardAppContext();
  const { reorderList, reorderCard, moveCard } = useScrumboardReorder(boardId || null);

  // Set selected board when data loads
  useEffect(() => {
    if (board) {
      setSelectedBoard(board);
    }
  }, [board, setSelectedBoard]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId, type } = result;

      // If dropped outside a valid droppable
      if (!destination) {
        return;
      }

      // If dropped in the same position
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      // Handle list reordering
      if (type === 'list') {
        if (!boardId) return;
        // Reorder lists - would call backend to persist order
      }

      // Handle card moving between lists or within list
      if (type === 'card') {
        if (!boardId) return;

        const sourceListId = source.droppableId;
        const destinationListId = destination.droppableId;

        if (sourceListId === destinationListId) {
          // Card reordered within same list
          reorderCard(sourceListId, [draggableId]);
        } else {
          // Card moved to different list
          moveCard({
            cardId: draggableId,
            fromListId: sourceListId,
            toListId: destinationListId,
            newIndex: destination.index,
          } as any);
        }
      }
    },
    [boardId, reorderList, reorderCard, moveCard]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Failed to load board</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Board not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <BoardHeader board={board} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <Droppable
              droppableId="board"
              type="list"
              direction="horizontal"
              ignoreContainerClipping
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="inline-flex gap-4 p-4 min-w-min"
                >
                  {board.columns && board.columns.length > 0 ? (
                    board.columns.map((col: any, index: number) => {
                      // Prefer fetching the full list object from lists query when available
                      let list: any;
                      // Normalize column id from different possible shapes
                      const getId = (v: any) => {
                        if (!v) return '';
                        if (typeof v === 'string' || typeof v === 'number') return String(v);
                        if (v._id) return String(v._id);
                        if (v.id) return String(v.id);
                        // Some backends return { _id: { $oid: '...' } }
                        if (v._id && typeof v._id === 'object' && v._id.$oid) return String(v._id.$oid);
                        return '';
                      };

                      const colId = getId(col);

                      if (lists && Array.isArray(lists)) {
                        const found = lists.find((l: any) => {
                          const lid = getId(l) || String(l._id || l.id || (l._id && l._id.$oid) || '');
                          return lid === colId || (!colId && lid === '') ;
                        });
                        if (found) {
                          list = found;
                        }
                      }

                      // Fallback normalization if not found in lists
                      if (!list) {
                        if (typeof col === 'string' || typeof col === 'number') {
                          list = { _id: String(col), board: board._id, name: '', position: index, workItems: [] };
                        } else {
                          list = {
                            _id: col._id || col.id,
                            board: col.board || board._id,
                            name: col.name || col.title || '',
                            position: col.position ?? index,
                            workItems: Array.isArray(col.workItems)
                              ? col.workItems.map((w: any) => (typeof w === 'string' ? w : w._id))
                              : [],
                          };
                        }
                      }
                      return (
                        <Draggable key={list._id} draggableId={list._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex-shrink-0 ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <BoardList
                                list={list}
                                boardId={board._id}
                                onCardClick={(card) => {
                                  setSelectedCard(card);
                                  setIsCardDialogOpen(true);
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-center py-8">No lists yet</div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      <BoardCardDialog />
    </div>
  );
}
