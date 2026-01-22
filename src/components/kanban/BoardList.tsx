import { useCallback } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { KanbanList, KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';
import { useDeleteKanbanBoardList } from '@/api/kanban/hooks/lists/useDeleteKanbanBoardList';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { Button } from '@/components/ui/button';
import { BoardCard } from './BoardCard';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { useGetKanbanBoardCards } from '@/api/kanban/hooks/cards/useGetKanbanBoardCards';

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

  const listIdNorm = normalizeId(list._id) || '';
  const droppableIdSafe = listIdNorm || `list-${boardId}-${Math.abs(String(list.name || '').length)}`;

  // Get cards for this list
  const getCardsForList = useCallback(() => {
    const listIdNormLocal = normalizeId(list._id);
    const cardsForList: (KanbanCard | Issue)[] = [];

    // 1. Add board-specific cards (KanbanCard)
    if (cards && cards.length > 0 && listIdNormLocal) {
      const matchingCardsByColumn = cards.filter((c: any) => {
        const colId = normalizeId((c as any).status || (c as any).column || (c as any).columnId);
        return colId === listIdNormLocal;
      });
      cardsForList.push(...(matchingCardsByColumn as KanbanCard[]));
    }

    // 2. Add workspace issues (Task/Story/Bug)
    if (issues && issues.length > 0 && listIdNormLocal) {
      const listName = String(list.name || '').toLowerCase().trim();
      const normalizeStr = (s: string) => s.toLowerCase().trim().replace(/[\s-_]+/g, '');
      const listNameNormalized = normalizeStr(list.name || '');

      // Debug log for first list only to avoid spam
      if (list.position === 0 || listNameNormalized === 'todo') {
        console.log(`[BoardList] Checking items for list: ${list.name} (${listIdNormLocal})`, {
          totalIssues: issues.length,
          listNameNormalized
        });
      }

      // Define status mapping (canonical IssueStatus-style slugs)
      const listNameToIssueStatus: Record<string, string> = {
        todo: 'to-do',
        backlog: 'to-do',
        inprogress: 'in-progress',
        inreview: 'in-review',
        done: 'done',
        blocked: 'blocked',
      };

      // Determine target status for this list
      let targetStatus = listNameToIssueStatus[listNameNormalized];
      if (!targetStatus && listName.includes('review')) targetStatus = 'in-review';
      if (!targetStatus && listName.includes('progress')) targetStatus = 'in-progress';
      if (!targetStatus && listName.includes('todo')) targetStatus = 'to-do';
      if (!targetStatus && listName.includes('done')) targetStatus = 'done';

      if (!targetStatus) {
        if (listNameNormalized === 'new' || listNameNormalized === 'open') targetStatus = 'to-do';
      }

      const matchingIssues = issues.filter((issue: Issue) => {
        const issueColumnId = normalizeId((issue as any).column);

        // A. If issue has a column and it matches this list, use that as source of truth
        if (issueColumnId && issueColumnId === listIdNormLocal) {
          return true;
        }

        // B. Otherwise (no column or mismatched), fall back to logical status
        if (targetStatus) {
          const rawStatus = String(issue.status || '').toLowerCase();
          const normalizedIssueStatus = normalizeStr(rawStatus);

          let canonicalIssueStatus: string;
          if (normalizedIssueStatus === 'todo') canonicalIssueStatus = 'to-do';
          else if (normalizedIssueStatus === 'backlog') canonicalIssueStatus = 'to-do';
          else if (normalizedIssueStatus === 'inprogress') canonicalIssueStatus = 'in-progress';
          else if (normalizedIssueStatus === 'inreview' || normalizedIssueStatus === 'review') canonicalIssueStatus = 'in-review';
          else if (normalizedIssueStatus === 'done') canonicalIssueStatus = 'done';
          else if (normalizedIssueStatus === 'blocked') canonicalIssueStatus = 'blocked';
          else canonicalIssueStatus = normalizedIssueStatus;

          const issueStatusNormalized = normalizeStr(canonicalIssueStatus);
          const targetStatusNormalized = normalizeStr(targetStatus);

          if (issueStatusNormalized === targetStatusNormalized) return true;
        }

        return false;
      });

      cardsForList.push(...matchingIssues);
    }

    const nonEpicCards = (cardsForList || []).filter((c: KanbanCard | Issue) => {
      const t = String((c as any).type || '').toLowerCase();
      return t !== 'epic';
    });

    // Remove duplicates
    const uniqueCardsById = Array.from(
      new Map(
        (nonEpicCards || []).map((c: KanbanCard | Issue) => [
          normalizeId((c as any)._id) || normalizeId((c as any).id) || Math.random(),
          c,
        ]),
      ).values(),
    );

    // Sort by workItems order if available
    if (list?.workItems && Array.isArray(list.workItems) && list.workItems.length > 0) {
      // ... (sorting logic remains similar)
      const workItemOrderMap = new Map(
        list.workItems.map((id: unknown, index: number) => [normalizeId(id), index]),
      );

      uniqueCardsById.sort((a: KanbanCard | Issue, b: KanbanCard | Issue) => {
        const cardAId = normalizeId((a as any)._id) || normalizeId((a as any).id);
        const cardBId = normalizeId((b as any)._id) || normalizeId((b as any).id);
        const orderA = workItemOrderMap.has(cardAId) ? workItemOrderMap.get(cardAId)! : 9999;
        const orderB = workItemOrderMap.has(cardBId) ? workItemOrderMap.get(cardBId)! : 9999;
        return orderA - orderB;
      });
    }

    return uniqueCardsById;
  }, [issues, list, normalizeId, droppableIdSafe, cards]);

  const cardsForThisList = getCardsForList();

  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex-1">
          {(() => {
            const rawName = (list && (list.name || (list as any).label || ''));
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
                cardsForThisList.map((card: KanbanCard | Issue, index: number) => {
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





