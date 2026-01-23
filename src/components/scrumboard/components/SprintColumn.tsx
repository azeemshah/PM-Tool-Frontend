import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/api/kanban/types';
import { Issue, TaskType } from '@/api/issue/types';
import WorkItemCard from './WorkItemCard';

interface SprintColumnProps {
  title: string;
  workItems: TaskType[];
  columnId: string;
  sprintId: string;
  onDelete?: (columnId: string) => void;
  isDeleting?: boolean;
  onCardClick?: (card: KanbanCard | Issue | TaskType) => void;
}

const SprintColumn: React.FC<SprintColumnProps> = ({
  title,
  workItems,
  columnId,
  sprintId,
  onDelete,
  onCardClick,
}) => {
  return (
    <div className="w-80 bg-white dark:bg-muted/50 rounded-lg shadow-sm border border-gray-200 dark:border-border flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 dark:bg-muted/50 dark:border-border flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-foreground">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{workItems.length || 0} items</p>
        </div>
        <button
          className="text-red-500 hover:text-red-700"
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

      {/* Cards */}
      <div className="flex-1 overflow-y-auto">
        <Droppable
          droppableId={columnId}
          type="card"
          ignoreContainerClipping
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 space-y-2 min-h-[100px] transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-transparent'
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
