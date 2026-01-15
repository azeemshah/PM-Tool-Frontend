import { useCallback } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { KanbanList, KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';
import { useGetKanbanBoardCards } from '@/api/kanban/hooks/cards/useGetKanbanBoardCards';
import { useDeleteKanbanBoardList } from '@/api/kanban/hooks/lists/useDeleteKanbanBoardList';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { Button } from '@/components/ui/button';
import { BoardCard } from './BoardCard';
import useWorkspaceId from '@/hooks/use-workspace-id';

interface BoardListProps {
  list: KanbanList;
  boardId: string;
  onCardClick: (card: KanbanCard | Issue) => void;
  issues?: Issue[];
}

export function BoardList({ list, boardId, onCardClick, issues = [] }: BoardListProps) {
  const workspaceId = useWorkspaceId();
  const { setIsIssueCreateDialogOpen } = useKanbanAppContext();

  const { mutate: deleteList } = useDeleteKanbanBoardList();

  const { data: cards } = useGetKanbanBoardCards(boardId);

  const handleCreateCard = useCallback(() => {
    setIsIssueCreateDialogOpen(true);
  }, [setIsIssueCreateDialogOpen]);

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

  const listIdNorm = normalizeId(list._id) || normalizeId(list.id) || '';
  const droppableIdSafe = listIdNorm || `list-${boardId}-${Math.abs(String(list.name || '').length)}`;

  // Get cards for this list
  const getCardsForList = useCallback(() => {
    const listIdNorm = normalizeId(list._id);
    try {
      console.log('BoardList debug', {
        droppableIdSafe,
        listIdNorm,
        cardsCount: (cards || []).length,
        issuesCount: (issues || []).length,
        listWorkItems: list?.workItems?.length || 0,
      });
    } catch {
      // ignore
    }

    const cardsForList = (cards || []).filter((c: Record<string, unknown>) => {
      // card status/column may be in different fields depending on backend
      const statusId = normalizeId(c.status || c.column || c.columnId);
      // Match when normalized ids equal, or status string contains the list id
      return (
        (listIdNorm && statusId === listIdNorm) ||
        (listIdNorm && typeof statusId === 'string' && statusId.includes(listIdNorm))
      );
    });

    // Map list names to issue statuses
    // Items API returns statuses like: 'Backlog', 'Todo', 'In Progress', 'Review', 'Done'
    const listNameToIssueStatus: Record<string, string> = {
      // Handle frontend list names to backend issue statuses
      'todo': 'todo',
      'to-do': 'todo',
      'to do': 'todo',
      'backlog': 'backlog',
      'in progress': 'in progress',
      'inprogress': 'in progress',
      'in-progress': 'in progress',
      'in_progress': 'in progress',
      'in review': 'review',
      'inreview': 'review',
      'in-review': 'review',
      'in_review': 'review',
      'done': 'done',
      'blocked': 'blocked',
    };

    // Normalize list name: lowercase, remove extra spaces, replace spaces with nothing
    const normalizeListName = (name: string) => {
      return name.toLowerCase().trim().replace(/\s+/g, '');
    };

    const listName = String(list.name || '').toLowerCase().trim();
    const listNameNormalized = normalizeListName(list.name || '');

    // Try to find matching status
    let matchingIssueStatus = listNameToIssueStatus[listName];
    if (!matchingIssueStatus) {
      // Try normalized version (without spaces)
      matchingIssueStatus = listNameToIssueStatus[listNameNormalized];
    }

    console.log(`🎯 Matching list "${list.name}" to issue status:`, {
      listName,
      listNameNormalized,
      matchingIssueStatus,
      availableStatusKeys: Object.keys(listNameToIssueStatus),
      issuesCount: issues?.length || 0,
      issueTypes: issues?.map((i: any) => i.type) || [],
      issueStatuses: issues?.map((i: any) => i.status) || [],
    });

    // Add issues that match the list's status
    if (matchingIssueStatus && issues && issues.length > 0) {
      const matchingIssues = issues.filter((issue: Issue) => {
        let issueStatus = String(issue.status || 'todo').toLowerCase();

        if (issueStatus === 'in_review' || issueStatus === 'in review') {
          issueStatus = 'review';
        }
        if (issueStatus === 'in_progress' || issueStatus === 'in progress') {
          issueStatus = 'in progress';
        }

        const matches = issueStatus === matchingIssueStatus;

        if (!matches) {
          console.log(`❌ Status mismatch: issue="${issue.title}" status="${issue.status}" (normalized="${issueStatus}") vs expected="${matchingIssueStatus}"`);
        } else {
          console.log(`✅ Issue matched: "${issue.title}" (type: ${issue.type}, status: ${issue.status})`);
        }

        return matches;
      });

      // Combine cards and issues
      cardsForList.push(...matchingIssues);

      console.log(`📊 Added ${matchingIssues.length} issues matching status "${matchingIssueStatus}" to list "${listName}"`);

      // Log all issues for debugging
      if (matchingIssues.length === 0 && issues.length > 0) {
        console.log(`📋 All issues available:`, issues.map((i: any) => ({
          title: i.title,
          status: i.status,
          normalized: String(i.status).toLowerCase(),
        })));
      }
    } else {
      console.log(`⚠️ No matching status found for list "${list.name}" or no issues available`);
    }

    // CRITICAL FIX: Sort cards based on list's workItems array order
    // This ensures the UI respects the order stored in the backend
    if (list?.workItems && Array.isArray(list.workItems) && list.workItems.length > 0) {
      const workItemOrderMap = new Map(
        list.workItems.map((id: unknown, index: number) => [normalizeId(id), index])
      );

      cardsForList.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const cardAId = normalizeId((a as any)._id) || normalizeId((a as any).id);
        const cardBId = normalizeId((b as any)._id) || normalizeId((b as any).id);
        const orderA = workItemOrderMap.get(cardAId) ?? 999;
        const orderB = workItemOrderMap.get(cardBId) ?? 999;
        return orderA - orderB;
      });

      console.log('Sorted cards by workItems order:', cardsForList.map((c: Record<string, unknown>) => normalizeId((c as any)._id) || normalizeId((c as any).id)));
    }

    // Deduplicate cards by id in case backend returns duplicates
    const uniqueCardsById = Array.from(
      new Map((cardsForList || []).map((c: Record<string, unknown>) => [normalizeId((c as any)._id) || normalizeId((c as any).id) || Math.random(), c])).values(),
    );

    return uniqueCardsById;
  }, [cards, issues, list, normalizeId, droppableIdSafe]);

  const cardsForThisList = getCardsForList();

  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex-1">
          {(() => {
            const rawName = (list && (list.name || list.title || (list as Record<string, unknown>).label || ''));
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
              className={`p-3 space-y-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
                }`}
            >
              {cardsForThisList.length > 0 ? (
                cardsForThisList.map((card: Record<string, unknown>, index: number) => {
                  const cardIdSafe =
                    normalizeId((card as any)._id) ||
                    normalizeId((card as any).id) ||
                    `card-${index}-${droppableIdSafe}`;

                  return (
                    <Draggable key={cardIdSafe} draggableId={String(cardIdSafe)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onCardClick(card as KanbanCard | Issue)}
                        >
                          <BoardCard
                            card={
                              {
                                ...(card as any),
                                board: boardId,
                                column: listIdNorm || (list as any)._id,
                              } as KanbanCard
                            }
                          />
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCreateCard}
          className="w-full justify-start text-gray-600 hover:bg-gray-50"
        >
          <Plus size={14} />
          <span className="ml-2">Add Issue</span>
        </Button>
      </div>
    </div>
  );
}





