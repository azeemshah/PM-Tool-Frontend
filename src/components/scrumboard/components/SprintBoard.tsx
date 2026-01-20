import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Calendar, Target, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sprint, SprintStats } from '@/api/scrumboard/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '@/api/issue/services/issueApiService';
import WorkItemCard from './WorkItemCard';
import SprintColumn from './SprintColumn';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { toast } from '@/hooks/use-toast';

interface SprintBoardProps {
  sprint: Sprint;
}

const SprintBoard: React.FC<SprintBoardProps> = ({ sprint }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

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
      ['backlog', 'todo'].includes(item.status?.toLowerCase()) || !item.status
    ).length,
    completionPercentage: sprintWorkItems.length > 0
      ? (sprintWorkItems.filter(item => item.status?.toLowerCase() === 'done').length / sprintWorkItems.length) * 100
      : 0,
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination or dropped in same position
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    // Determine new status based on destination column
    let newStatus: string;
    switch (destination.droppableId) {
      case 'todo':
        newStatus = 'Todo';
        break;
      case 'in-progress':
        newStatus = 'In Progress';
        break;
      case 'done':
        newStatus = 'Done';
        break;
      default:
        return;
    }

    // Update work item status
    updateWorkItemMutation.mutate({
      itemId: draggableId,
      data: { status: newStatus },
    });
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
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkItems}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">To Do</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todoWorkItems}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                📋
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgressWorkItems}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                ⚡
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Done</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedWorkItems}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                ✅
              </div>
            </div>
          </Card>
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
      </div>

      {/* Sprint Board Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <div className="inline-flex gap-4 p-4 min-w-min">
              <SprintColumn
                title="To Do"
                workItems={sprintWorkItems.filter(item =>
                  ['backlog', 'todo'].includes(item.status?.toLowerCase()) || !item.status
                )}
                columnId="todo"
                sprintId={sprint._id}
              />

              <SprintColumn
                title="In Progress"
                workItems={sprintWorkItems.filter(item =>
                  ['in progress', 'in review', 'inprogress'].includes(item.status?.toLowerCase())
                )}
                columnId="in-progress"
                sprintId={sprint._id}
              />

              <SprintColumn
                title="Done"
                workItems={sprintWorkItems.filter(item =>
                  item.status?.toLowerCase() === 'done'
                )}
                columnId="done"
                sprintId={sprint._id}
              />
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default SprintBoard;