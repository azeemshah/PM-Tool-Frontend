import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/api/kanban/types';
import { Issue, TaskType } from '@/api/issue/types';
import WorkItemCard from './WorkItemCard';
import { badgeVariants } from '@/components/ui/badge';
import { getStatusIcon } from '@/components/workspace/task/table/data';
import { getGanttStatusColor } from '@/components/gantt-chart/utils/colorMaps';
import { cn } from '@/lib/utils';

interface SprintColumnProps {
  title: string;
  workItems: TaskType[];
  columnId: string;
  sprintId: string;
  onDelete?: (columnId: string) => void;
  isDeleting?: boolean;
  onCardClick?: (card: KanbanCard | Issue | TaskType) => void;
  boardId?: string;
  availableStatuses?: { label: string; value: string }[];
}

const SprintColumn: React.FC<SprintColumnProps> = ({
  title,
  workItems,
  columnId,
  sprintId,
  onDelete,
  onCardClick,
  boardId,
  availableStatuses,
}) => {
  return (
    <div className="w-96 bg-white dark:bg-muted/50 rounded-lg shadow-sm border border-gray-200 dark:border-border flex flex-col max-h-full">
      {/* Header */}
      {(() => {
        const colors = getGanttStatusColor(title);
        const StatusIcon = getStatusIcon(title);

        return (
          <div className={cn(
            "p-3 border-b flex items-center justify-between rounded-t-lg rounded-b-none border-x-0 border-t-0",
            colors.bg,
            colors.text,
            colors.border
          )}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <h3 className="font-semibold text-sm capitalize">{title}</h3>
              <span className="ml-2 text-xs opacity-80 bg-white/20 px-1.5 py-0.5 rounded-full">{workItems.length || 0}</span>
            </div>
            <button
              className="text-inherit hover:text-inherit hover:bg-black/10 p-1 rounded-md transition-colors"
              onClick={() => {
                const ok = confirm('Are You Sure?');
                if (!ok) return;
                onDelete && onDelete(columnId);
              }}
              title="Delete Column"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })()}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto scrollbar">
        <Droppable
          droppableId={columnId}
          type="card"
          ignoreContainerClipping
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 space-y-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-transparent'
                }`}
            >
              {workItems.length > 0 ? (
                workItems.map((workItem: TaskType, index: number) => {
                  const cardIdSafe = workItem._id || `card-${index}-${columnId}`;

                  return (
                    <Draggable key={cardIdSafe} draggableId={String(cardIdSafe)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <WorkItemCard
                            card={workItem}
                            onClick={() => onCardClick && onCardClick(workItem as any)}
                            boardId={boardId}
                            availableStatuses={availableStatuses}
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
    </div>
  );
};

export default SprintColumn;
