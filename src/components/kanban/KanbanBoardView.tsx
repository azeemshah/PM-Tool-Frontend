import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGetKanbanBoard } from '@/api/kanban/hooks/boards/useGetKanbanBoard';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { useKanbanReorder } from '@/api/kanban/hooks/order/useKanbanReorder';
import { useGetKanbanBoardCards } from '@/api/kanban/hooks/cards/useGetKanbanBoardCards';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';
import type { TaskType } from '@/api/issue/types';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { mapColumnToStatus } from '@/lib/helper';
import { BoardHeader } from './BoardHeader';
import { BoardList } from './BoardList';
import { BoardCardDialog } from './dialogs/BoardCardDialog';
import { IssueCreateDialog } from '@/components/issue';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useTags } from '@/hooks/api/use-tags';


export function KanbanBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const workspaceIdParam = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: board, isLoading, error } = useGetKanbanBoard(boardId || '');
  const { data: lists } = useGetKanbanBoardLists(boardId || null);
  const { data: boardLabels = [] } = useGetKanbanBoardLabels(boardId || '');

  const {
    setSelectedBoard,
    setSelectedCard,
    setIsCardDialogOpen,
    isIssueCreateDialogOpen,
    setIsIssueCreateDialogOpen,
  } = useKanbanAppContext();

  const workspaceId = workspaceIdParam || '';
  const { scrollableRef, setDragging } = useAutoScroll({
    scrollThreshold: 50,
    scrollSpeed: 8,
  });

  const { getAllTagsByWorkspace } = useTags();
  const { data: allTags = [] } = getAllTagsByWorkspace(workspaceId);
  
  // Map for resolving Tags (legacy/system tags)
  const tagsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(allTags)) {
      allTags.forEach((tag: any) => {
        if (tag._id && tag.name) {
          map.set(tag._id, tag.name);
        }
      });
    }
    return map;
  }, [allTags]);

  // Map for resolving Board Labels
  const labelsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    if (Array.isArray(boardLabels)) {
      boardLabels.forEach((label: any) => {
        if (label._id && label.name) {
          map.set(label._id, { name: label.name, color: label.color || '#3b82f6' });
        }
      });
    }
    return map;
  }, [boardLabels]);

  // Fetch workspace items (All Tasks) and treat them as issues for the board
  // Fetch workspace items (All Tasks) and treat them as issues for the board
  const { data: workspaceItemsData = [] } = useQuery({
    queryKey: ['all-tasks', 'kanban', workspaceId || 'unknown'],
    queryFn: async () => {
      console.log('[KanbanBoardView] Fetching tasks for workspace:', workspaceId);
      if (!workspaceId) return [];

      try {
        const response = await issueApiService.getTasksByWorkspace(workspaceId, { limit: 1000 });
        // Extract array safely
        const tasks = Array.isArray(response?.data) ? response.data : [];
        console.log('[KanbanBoardView] Fetched tasks:', tasks.length);
        return tasks;
      } catch (e) {
        console.error('[KanbanBoardView] Failed to fetch tasks:', e);
        return [];
      }
    },
    enabled: !!workspaceId,
  });

  // Ensure workspaceItems is always an array
  const workspaceItems: TaskType[] = Array.isArray(workspaceItemsData) ? (workspaceItemsData as TaskType[]) : [];


  // Normalize workspace items into Issue-like objects for board usage
  const issues = useMemo(() => {
    const itemsArray = Array.isArray(workspaceItems) ? workspaceItems : [];
    const byId = new Map<string, any>(
      itemsArray.map((it: any) => [String(it._id), it]),
    );

    return itemsArray.map((item: any) => {
      const base: any = {
        _id: item._id,
        type: item.type,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        dueDate: item.dueDate,
        column: item.column,
        assignedTo: item.assignedTo,
        reporter: item.reporter,
        timeSpent: item.timeSpent,
        storyPoints: item.storyPoints,
        tags: item.tags,
        labels: item.labels,
        assignee: (item.assignedTo && typeof item.assignedTo === 'object' && (item.assignedTo._id || item.assignedTo.id))
          ? {
            _id: item.assignedTo._id || item.assignedTo.id,
            name: item.assignedTo.name,
          }
          : undefined,
      };

      const parentId = item.parent || null;
      const parentItem = parentId ? byId.get(String(parentId)) : null;
      const parentType = parentItem ? String(parentItem.type || '').toLowerCase() : null;
      const parentTitle = parentItem ? parentItem.title : null;

      if (item.type === 'subtask') {
        base.parentIssueId = parentId || undefined;
        base.parentTitle = parentTitle || undefined;
        base.parentType = parentType || undefined;
      } else if (['story', 'task', 'bug'].includes(String(item.type).toLowerCase())) {
        base.epicId = parentId || undefined;
        base.epicTitle = parentTitle || undefined;
      }

      return base as Issue;
    });
  }, [workspaceItems]);

  const { reorderCard, moveCard, reorderColumn, isMovingCard, isReorderingCard, isReorderingColumn } = useKanbanReorder(boardId || null);
  const { data: cards } = useGetKanbanBoardCards(boardId || '');

  // Determine which columns to render
  // Prioritize 'lists' query result as it contains full column details
  // If 'lists' is unavailable, fall back to 'board.columns'
  const columnsToRender = useMemo(() => {
    if (lists && lists.length > 0) {
      // Sort lists by position
      return [...lists].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    return board?.columns || [];
  }, [lists, board?.columns]);

  // Debug: log fetched board columns and lists to diagnose missing list names
  try {
    console.log('🔍 KanbanBoardView Debug:', {
      workspaceId,
      issuesCount: issues.length,
      issuesList: issues.map((i: any) => ({
        id: i._id,
        title: i.title,
        type: i.type,
        status: i.status,
        statusString: String(i.status).toLowerCase(),
      })),
      boardId,
      listsCount: lists?.length,
      cardsCount: cards?.length,
    });
  } catch (e) {
    console.error('Debug logging error:', e);
  }

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

  // Handle card click - accepts both KanbanCard and Issue types
  const handleCardClick = useCallback((card: KanbanCard | Issue) => {
    // Only open dialog for Issues, not KanbanCards
    if ('type' in card && ['epic', 'story', 'task', 'bug', 'subtask'].includes(String((card as any).type))) {
      setSelectedCard(card);
      setIsCardDialogOpen(true);
    }
  }, [setSelectedCard, setIsCardDialogOpen]);

  const normalizeId = useCallback((v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (obj.$oid) return String(obj.$oid);
      if (obj.id) return String(obj.id);
      if (obj._id && typeof obj._id === 'object' && obj._id !== null) {
        const idObj = obj._id as Record<string, unknown>;
        if (idObj.$oid) return String(idObj.$oid);
      }
      if (obj._id && (typeof obj._id === 'string' || typeof obj._id === 'number')) return String(obj._id);
      if (obj._bsontype === 'ObjectID' && typeof (obj as { toHexString?: () => string }).toHexString === 'function') {
        return String((obj as { toHexString: () => string }).toHexString());
      }
    }
    return '';
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setDragging(false);
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

        // Get current column order from columnsToRender
        const currentColumnIds = columnsToRender.map((col: any) => {
          if (typeof col === 'string') return col;
          return col._id || col.id;
        });

        // Create new order by moving column from source to destination
        const newColumnIds = [...currentColumnIds];
        const [movedColumn] = newColumnIds.splice(source.index, 1);
        newColumnIds.splice(destination.index, 0, movedColumn);

        // Call backend to persist reorder
        reorderColumn(newColumnIds);
        setDragError(null);
        return;
      }

      // Handle card moving between lists or within list
      if (type === 'card') {
        if (!boardId) return;

        const sourceListId = source.droppableId;
        const destinationListId = destination.droppableId;

        const draggedId = String(draggableId);
        const kanbanCard =
          (cards || []).find((c: any) => normalizeId(c._id) === draggedId || normalizeId((c as any).id) === draggedId) ||
          null;
        const issueCard =
          issues.find((i: any) => normalizeId(i._id) === draggedId) || null;

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

            if (kanbanCard) {
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

              const currentOrder = [...cardsInThisList];
              if (currentOrder.length === 0) return;

              const currentPosition = currentOrder.findIndex((id: any) => normalizeId(id) === draggedId);
              if (currentPosition === -1) return;

              // Correct array manipulation for drag-drop
              const newOrder = [...currentOrder];
              // Remove from source position
              const [movedItem] = newOrder.splice(source.index, 1);
              // Insert at destination
              newOrder.splice(destination.index, 0, movedItem);

              reorderCard(sourceListId, newOrder.map(id => String(id)));
              setDragError(null);
            } else {
              // Issue reordering within same list
              console.log('Reordering issues within list is not yet persisted via API');
            }
          } else {
            console.log('Moving card between lists:', {
              cardId: draggableId,
              fromListId: sourceListId,
              toListId: destinationListId,
              newIndex: destination.index,
            });

            if (issueCard) {
              // Optimistic Update for Issue
              const destList = (lists || []).find(l => normalizeId(l._id) === destinationListId) ||
                (board?.columns || []).find((c: any) => normalizeId(c._id || c.id) === destinationListId);

              let newStatus = issueCard.status;
              if (destList) {
                const listName = typeof destList === 'string' ? destList : (destList.name || '');
                if (listName) {
                  const mappedStatus = mapColumnToStatus(listName);
                  // Map to Title Case if needed (TaskStatusEnum)
                  if (mappedStatus === 'to-do') newStatus = 'To Do';
                  else if (mappedStatus === 'in-progress') newStatus = 'In Progress';
                  else if (mappedStatus === 'in-review') newStatus = 'In Review';
                  else if (mappedStatus === 'blocked') newStatus = 'Blocked';
                  else if (mappedStatus === 'done') newStatus = 'Done';
                  else if (mappedStatus === 'closed') newStatus = 'Closed';
                  else newStatus = mappedStatus;
                }
              }

              const queryKey = ['all-tasks', 'kanban', workspaceId];
              const previousData = queryClient.getQueryData(queryKey);

              // Optimistically update cache
              queryClient.setQueryData(queryKey, (old: any[]) => {
                if (!old) return [];
                return old.map((item: any) => {
                  if (normalizeId(item._id) === draggedId) {
                    return {
                      ...item,
                      column: destinationListId,
                      status: newStatus
                    };
                  }
                  return item;
                });
              });

              setDragError(null);

              try {
                await issueApiService.moveItemToColumn(draggedId, destinationListId);
                // Success
                queryClient.invalidateQueries({ queryKey: ['history'] });
              } catch (error) {
                console.error('Error moving issue card:', error);
                setDragError('Failed to move card. Please try again.');
                // Revert
                queryClient.setQueryData(queryKey, previousData);
              }
            } else if (kanbanCard) {
              moveCard({
                cardId: draggedId,
                fromListId: sourceListId,
                toListId: destinationListId,
                newIndex: destination.index,
              });
              setDragError(null);
            } else {
              console.warn('Dragged card not found in Kanban cards or issues');
              lastDragState.current = null;
            }
          }
        } catch (err) {
          console.error('Error moving card:', err);
          setDragError('Failed to move card. Please try again.');
          lastDragState.current = null;
        }
      }
    },
    [boardId, cards, issues, reorderCard, moveCard, reorderColumn, workspaceId, queryClient, lists, board, columnsToRender, normalizeId, setDragging]
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background">
      <BoardHeader board={board} />

      {/* Error notification */}
      {dragError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{dragError}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setDragError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
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
      {(isMovingCard || isReorderingCard || isReorderingColumn) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">{isReorderingColumn ? 'Moving column...' : 'Moving card...'}</p>
            </div>
          </div>
        </div>
      )}

      <DragDropContext
        onDragEnd={handleDragEnd}
        onBeforeDragStart={() => setDragging(true)}
      >
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollableRef}
            className="h-full overflow-x-auto scrollbar"
          >
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
                  {columnsToRender && columnsToRender.length > 0 ? (
                    columnsToRender.map((col: any, index: number) => {
                      // Prefer fetching the full list object from lists query when available
                      let list = col;
                      // Normalize column id from different possible shapes
                      const normalizeId = (v: unknown): string => {
                        if (!v) return '';
                        if (typeof v === 'string' || typeof v === 'number') return String(v);
                        if (typeof v === 'object' && v !== null) {
                          const obj = v as Record<string, unknown>;
                          if (obj._id && typeof obj._id === 'object' && (obj._id as any).$oid) return String((obj._id as any).$oid);
                          if (obj._id) return String(obj._id);
                          if (obj.id) return String(obj.id);
                          if (obj.$oid) return String(obj.$oid);
                        }
                        return '';
                      };

                      const colId = normalizeId(col);

                      // If we are iterating board.columns (which might be IDs or partials) and have lists
                      if (lists && Array.isArray(lists) && (!list.name || !list._id)) {
                        const found = lists.find((l) => {
                          const lid = normalizeId(l._id);
                          return lid === colId || (!colId && lid === '');
                        });
                        if (found) {
                          // Ensure the list object has a normalized string _id that matches column ids
                          const normalizedFoundId = normalizeId(found._id) || normalizeId(found);
                          list = { ...found, _id: normalizedFoundId || found._id };
                        }
                      }

                      // Fallback normalization if not found in lists
                      if (!list || !list._id) {
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
                              className={`flex-shrink-0 ${snapshot.isDragging ? 'opacity-50' : ''
                                }`}
                            >
                              <BoardList
                                list={list}
                                boardId={board._id}
                                onCardClick={handleCardClick}
                                issues={issues}
                                tagsMap={tagsMap}
                                labelsMap={labelsMap}
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
        workspaceId={workspaceId}
        boardId={board?._id}
        onSuccess={() => {
          // Optionally close the card dialog after successful issue creation
          setIsCardDialogOpen(false);
        }}
      />
    </div>
  );
}





