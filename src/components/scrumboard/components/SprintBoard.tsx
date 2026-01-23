import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Calendar, Target, Users, TrendingUp, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Sprint, SprintStats } from '@/api/scrumboard/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { SprintApiService } from '@/api/scrumboard/services/SprintApiService';
import { KanbanApiService } from '@/api/kanban/services/KanbanApiService';
import WorkItemCard from './WorkItemCard';
import SprintColumn from './SprintColumn';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { toast } from '@/hooks/use-toast';
import { useAutoScroll } from '@/hooks/use-auto-scroll';

interface SprintBoardProps {
  sprint: Sprint;
}

const SprintBoard: React.FC<SprintBoardProps> = ({ sprint }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [columnOrder, setColumnOrder] = useState<string[]>(sprint.columns || ['To Do', 'In Progress', 'In Review', 'Done']);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const { scrollableRef, setDragging } = useAutoScroll({
    scrollThreshold: 50,
    scrollSpeed: 8,
  });

  const normalizeColumnName = (name: string) => {
    switch (name.toLowerCase()) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
      default: return name;
    }
  };

  // Sync columnOrder with sprint.columns when sprint data updates
  useEffect(() => {
    const currentCols = sprint.columns || ['To Do', 'In Progress', 'In Review', 'Done'];
    const normalizedCols = currentCols.map(normalizeColumnName);

    setColumnOrder(normalizedCols);

    // Auto-migrate legacy columns to new format
    if (JSON.stringify(currentCols) !== JSON.stringify(normalizedCols)) {
      updateColumnsMutation.mutate(normalizedCols);
    }
  }, [sprint.columns]);

  // Mutation to update columns in backend
  const updateColumnsMutation = useMutation({
    mutationFn: (columns: string[]) => SprintApiService.updateSprintColumns(sprint._id, columns),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sprints', workspaceId],
      });
      toast({
        title: 'Success',
        description: 'Columns updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update columns',
        variant: 'destructive',
      });
    },
  });

  const { data: allWorkItems = [] } = useQuery({
    queryKey: ['workspace-items', workspaceId],
    queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  const updateWorkItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      issueApiService.updateItem(itemId, data),
    onMutate: async ({ itemId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workspace-items', workspaceId] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(['workspace-items', workspaceId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['workspace-items', workspaceId], (old: any[]) => {
        return old?.map((item) =>
          item._id === itemId ? { ...item, ...data } : item
        );
      });

      // Return a context object with the snapshotted value
      return { previousItems };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['workspace-items', workspaceId], context?.previousItems);
      toast({
        title: 'Error',
        description: 'Failed to update work item status',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-items', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => KanbanApiService.deleteKanbanBoardList(boardId || '', columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['kanban-board-lists', boardId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sprints', workspaceId],
      });
      toast({
        title: 'Success',
        description: 'Column deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete column',
        variant: 'destructive',
      });
    },
  });

  // Filter work items that belong to this sprint
  const sprintWorkItems = allWorkItems.filter((item: any) =>
    sprint.workItems.includes(item._id)
  );

  // Calculate sprint statistics
  const stats: SprintStats = {
    totalWorkItems: sprintWorkItems.length,
    completedWorkItems: sprintWorkItems.filter(item => item.status?.toLowerCase() === 'done').length,
    inProgressWorkItems: sprintWorkItems.filter(item =>
      ['in progress', 'in review', 'inprogress'].includes(item.status?.toLowerCase())
    ).length,
    todoWorkItems: sprintWorkItems.filter(item =>
      ['backlog', 'todo', 'to do'].includes(item.status?.toLowerCase()) || !item.status
    ).length,
    completionPercentage: sprintWorkItems.length > 0
      ? (sprintWorkItems.filter(item => item.status?.toLowerCase() === 'done').length / sprintWorkItems.length) * 100
      : 0,
  };

  const handleDragEnd = (result: DropResult) => {
    setDragging(false);
    const { destination, source, draggableId, type } = result;

    // If no destination or dropped in same position
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    // Handle column reordering
    if (type === 'column') {
      const newColumnOrder = [...columnOrder];
      const [movedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, movedColumn);
      setColumnOrder(newColumnOrder);
      // Persist to backend
      updateColumnsMutation.mutate(newColumnOrder);
      return;
    }

    // Handle card movement between columns
    if (type === 'card') {
      // Use the column ID as the status directly since we are using sprint columns now
      const newStatus = destination.droppableId;

      console.log('Moving item to column:', {
        itemId: draggableId,
        columnId: destination.droppableId,
        columnName: newStatus
      });

      // Update work item status and column
      updateWorkItemMutation.mutate({
        itemId: draggableId,
        data: {
          status: newStatus,
        },
      });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Error',
        description: 'Column name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newColumn = newColumnName.trim();

      // Check if column already exists
      if (columnOrder.includes(newColumn)) {
        toast({
          title: 'Error',
          description: 'Column already exists',
          variant: 'destructive',
        });
        return;
      }

      const newColumnOrder = [...columnOrder, newColumn];
      setColumnOrder(newColumnOrder);
      updateColumnsMutation.mutate(newColumnOrder);

      // Reset form
      setNewColumnName('');
      setIsAddingColumn(false);

      toast({
        title: 'Success',
        description: `Column "${newColumn}" added successfully`,
      });
    } catch (error) {
      console.error('Failed to create column:', error);
      toast({
        title: 'Error',
        description: 'Failed to create column',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining < 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sprint Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{sprint.name}</h1>
              <Badge
                variant={sprint.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {sprint.status}
              </Badge>
            </div>
            {sprint.goal && (
              <p className="text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {sprint.goal}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </span>
              </div>
              <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
              </div>
            </div>
            <Button
              onClick={() => setIsAddingColumn(true)}
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              Add Column
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sprint Progress</span>
            <span className="text-sm text-gray-600">
              {stats.completionPercentage.toFixed(0)}% complete
            </span>
          </div>
          <Progress value={stats.completionPercentage} className="h-2" />
        </div>

        {/* Add Column Input */}
        {isAddingColumn && (
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Enter column name..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddColumn();
                }
              }}
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleAddColumn}
              disabled={!newColumnName.trim()}
              size="sm"
            >
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingColumn(false);
                setNewColumnName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Sprint Board Columns */}
      <DragDropContext
        onDragEnd={handleDragEnd}
        onBeforeDragStart={() => setDragging(true)}
      >
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollableRef}
            className="h-full overflow-x-auto"
          >
            <Droppable
              droppableId="sprint-columns"
              type="column"
              direction="horizontal"
              ignoreContainerClipping
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="inline-flex gap-4 p-4 min-w-min"
                >
                  {columnOrder.map((columnId, index) => {
                    // In sprint board, columnId is the column name/title
                    const title = columnId;

                    // Filter work items for this column by matching status to column name
                    const workItems = sprintWorkItems.filter((item: any) =>
                      item.status === title || (item.status?.toLowerCase() === title?.toLowerCase())
                    );

                    return (
                      <Draggable key={columnId} draggableId={columnId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <SprintColumn
                              title={title}
                              workItems={workItems}
                              columnId={columnId}
                              sprintId={sprint._id}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default SprintBoard;