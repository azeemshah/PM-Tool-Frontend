import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams } from 'react-router-dom';
import { useGetScrumboardBoard } from '@/api/scrumboard/hooks/boards/useGetScrumboardBoard';
import { useGetScrumboardBoardLists } from '@/api/scrumboard/hooks/lists/useGetScrumboardBoardLists';
import { useScrumboardReorder } from '@/api/scrumboard/hooks/order/useScrumboardReorder';
import { useGetScrumboardBoardCards } from '@/api/scrumboard/hooks/cards/useGetScrumboardBoardCards';
import { useScrumboardAppContext } from '@/contexts/ScrumboardAppContext';
import { BoardHeader } from './BoardHeader';
import { BoardList } from './BoardList';
import { BoardCardDialog } from './dialogs/BoardCardDialog';
import { IssueCreateDialog } from '@/components/issue';
import useWorkspaceId from '@/hooks/use-workspace-id';

export function ScrumboardBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const workspaceId = useWorkspaceId();
  const { data: board, isLoading, error } = useGetScrumboardBoard(boardId || '');
  const { data: lists } = useGetScrumboardBoardLists(boardId || null);
  // Debug: log fetched board columns and lists to diagnose missing list names
  try {
    console.log('ScrumboardBoardView: board.columns', board?.columns);
    console.log('ScrumboardBoardView: lists', lists);
  } catch (e) {
    // ignore
  }
  const { 
    setSelectedBoard, 
    setSelectedCard, 
    setIsCardDialogOpen,
    isIssueCreateDialogOpen,
    setIsIssueCreateDialogOpen,
    issueCreateProjectId,
  } = useScrumboardAppContext();
  const { reorderCard, moveCard, isMovingCard, isReorderingCard } = useScrumboardReorder(boardId || null);
  const { data: cards } = useGetScrumboardBoardCards(boardId || '');
  
  // Track the last drag state for potential undo on error
  const lastDragState = useRef<{
    sourceListId: string;
    sourceIndex: number;
    destinationListId: string;
    destinationIndex: number;
  } | null>(null);

  const [dragError, setDragError] = useState<string | null>(null);

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
        console.log('Dropped outside valid droppable, reverting position');
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
        
        // Store the drag state for potential revert
        lastDragState.current = {
          sourceListId,
          sourceIndex: source.index,
          destinationListId,
          destinationIndex: destination.index,
        };

        try {
          if (sourceListId === destinationListId) {
              // Card reordered within same list
              console.log('=== SAME-LIST REORDER ===');
              console.log('Source list:', sourceListId);
              console.log('Dragged card:', draggableId);
              console.log('Destination index:', destination.index);

              // Get ALL cards for debugging
              console.log('All cards in state:', cards?.length || 0);
              if (cards && cards.length > 0) {
                console.log('Sample card:', cards[0]);
              }

              // Simple approach: just reorder based on drag-drop indices
              // The backend doesn't actually care about the intermediate cards - just the order
              
              // Get cards currently assigned to this list
              const listId = sourceListId;
              const cardsInThisList = (cards || [])
                .filter((c: any) => {
                  // Check if card belongs to this list/column
                  const colId = c.status || c.column || c.columnId;
                  // Direct comparison - both should be ObjectId strings
                  return colId && String(colId).includes(String(listId)) || String(colId) === String(listId);
                })
                .map((c: any) => c._id || c.id)
                .filter(Boolean);

              console.log('Cards found in this list:', cardsInThisList.length);
              console.log('Card IDs:', cardsInThisList);

              // The dragged card ID is the draggableId
              const draggedCardId = String(draggableId);
              
              // Get current order from Draggable indices
              const currentOrder = [...cardsInThisList];
              console.log('Current order before:', currentOrder);

              // If list is empty, there's nothing to reorder
              if (currentOrder.length === 0) {
                console.warn('No cards in list, nothing to reorder');
                lastDragState.current = null;
                return;
              }

              // Find the current position of the dragged card
              const currentPosition = currentOrder.findIndex((id: any) => String(id) === draggedCardId);
              console.log('Source index:', source.index, 'Destination index:', destination.index);

              // If card moved to same index, no reorder needed
              if (source.index === destination.index) {
                console.log('Card moved to same index, no reorder needed');
                lastDragState.current = null;
                return;
              }

              // CRITICAL FIX: Correct array manipulation for drag-drop
              // When removing an element, indices shift, so we need to adjust destination
              const newOrder = [...currentOrder];
              
              // Remove from source position
              const [movedItem] = newOrder.splice(source.index, 1);
              
              // When moving DOWN, destination index decreases by 1 after removal
              // When moving UP, destination index stays the same
              const adjustedDestination = source.index < destination.index 
                ? destination.index - 1 
                : destination.index;
              
              // Insert at adjusted destination
              newOrder.splice(adjustedDestination, 0, movedItem);

              console.log('Move direction:', source.index < destination.index ? 'DOWN' : 'UP');
              console.log('Adjusted destination index:', adjustedDestination);
              console.log('New order after:', newOrder);
              console.log('Calling reorderCard mutation...');
              
              // Call the reorder mutation
              reorderCard(sourceListId, newOrder.map(id => String(id)));
            } else {
            // Card moved to different list
            console.log('Moving card between lists:', { 
              cardId: draggableId,
              fromListId: sourceListId,
              toListId: destinationListId,
              newIndex: destination.index
            });
            moveCard({
              cardId: draggableId,
              fromListId: sourceListId,
              toListId: destinationListId,
              newIndex: destination.index,
            });
          }
          // Clear error on successful move
          setDragError(null);
        } catch (err) {
          console.error('Error moving card:', err);
          setDragError('Failed to move card. Please try again.');
          lastDragState.current = null;
        }
      }
    },
    [boardId, cards, reorderCard, moveCard]
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

      {/* Error notification */}
      {dragError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{dragError}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setDragError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for drag operations */}
      {(isMovingCard || isReorderingCard) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">Moving card...</p>
            </div>
          </div>
        </div>
      )}

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
                    board.columns.map((col, index: number) => {
                      // Prefer fetching the full list object from lists query when available
                      let list;
                      // Normalize column id from different possible shapes
                      const normalizeId = (v: unknown): string => {
                        if (!v) return '';
                        if (typeof v === 'string' || typeof v === 'number') return String(v);
                        if (v._id && typeof v._id === 'object' && v._id.$oid) return String(v._id.$oid);
                        if (v._id) return String(v._id);
                        if (v.id) return String(v.id);
                        if (v.$oid) return String(v.$oid);
                        return '';
                      };

                      const colId = normalizeId(col);

                      if (lists && Array.isArray(lists)) {
                        const found = lists.find((l) => {
                          const lid = normalizeId(l) || normalizeId(l._id) || normalizeId(l.id);
                          return lid === colId || (!colId && lid === '');
                        });
                        if (found) {
                          // Ensure the list object has a normalized string _id that matches column ids
                          const normalizedFoundId = normalizeId(found._id) || normalizeId(found.id) || normalizeId(found);
                          list = { ...found, _id: normalizedFoundId || found._id };
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
                              ? col.workItems.map((w) => (typeof w === 'string' ? w : w._id))
                              : [],
                          };
                        }
                      }
                      // Ensure final list._id is a string
                      list._id = String(list._id || list.id || `list-${index}-${board._id}`);
                      const listIdSafe = String(list._id);
                      return (
                        <Draggable key={listIdSafe} draggableId={listIdSafe} index={index}>
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
      <IssueCreateDialog
        isOpen={isIssueCreateDialogOpen}
        onOpenChange={(open) => setIsIssueCreateDialogOpen(open)}
        projectId={issueCreateProjectId || ''}
        workspaceId={workspaceId}
        onSuccess={() => {
          // Optionally close the card dialog after successful issue creation
          setIsCardDialogOpen(false);
        }}
      />
    </div>
  );
}
