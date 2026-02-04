import React, { useState } from 'react';
import { Plus, Play, CheckCircle, RotateCcw, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprint } from '@/api/scrumboard/types';
import { useUpdateSprintStatus } from '@/api/scrumboard/hooks/sprints/useUpdateSprintStatus';
import SprintCreationDialog from './SprintCreationDialog';
import SprintEditDialog from './SprintEditDialog';
import CompleteSprintDialog from './CompleteSprintDialog';
import { useDeleteSprint } from '@/api/scrumboard/hooks/sprints/useDeleteSprint';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { toast } from '@/hooks/use-toast';

interface SprintListProps {
  sprints: Sprint[];
  activeSprintId: string | null;
  onSprintSelect: (sprintId: string | null) => void;
}

const SprintList: React.FC<SprintListProps> = ({
  sprints,
  activeSprintId,
  onSprintSelect,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [completeSprintDialogOpen, setCompleteSprintDialogOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<Sprint | null>(null);
  const updateSprintMutation = useUpdateSprintStatus();
  const deleteSprintMutation = useDeleteSprint();
  const workspaceId = useWorkspaceId();
  const [editTarget, setEditTarget] = useState<Sprint | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'ACTIVE':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'secondary';
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleSprintAction = async (sprintId: string, action: 'start' | 'complete' | 'reopen', targetSprintId?: string) => {
    try {
      await updateSprintMutation.mutateAsync({
        sprintId,
        action,
        workspaceId: sprints.find(s => s._id === sprintId)?.workspaceId || '',
        ...(targetSprintId && { targetSprintId }),
      });
      toast({
        title: 'Success',
        description: `Sprint ${action}d successfully`,
      });
    } catch (error: any) {
      console.error(`Failed to ${action} sprint:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} sprint`,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-80 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Sprints</h2>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </Button>
        </div>
      </div>

      {/* Sprint List */}
      <div className="flex-1 overflow-y-auto">
        {/* Backlog Option */}
        <div
          className={`p-3 border-b border-gray-100 dark:border-border/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-muted/50 ${activeSprintId === null ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
            }`}
          onClick={() => onSprintSelect(null)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-muted rounded flex items-center justify-center">
              📋
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-foreground">Backlog</h3>
              <p className="text-sm text-gray-500">Work items not in sprints</p>
            </div>
          </div>
        </div>

        {/* Sprints */}
        {sprints.map((sprint) => (
          <Card
            key={sprint._id}
            className={`m-2 cursor-pointer transition-colors dark:bg-card dark:border-border ${activeSprintId === sprint._id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 border-l-4 border-l-blue-500 dark:border-l-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-muted/50'
              }`}
            onClick={() => onSprintSelect(sprint._id)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(sprint.status)}
                  <h3 className="font-medium text-gray-900 dark:text-foreground truncate">
                    {sprint.name}
                  </h3>
                </div>
                <Badge variant={getStatusColor(sprint.status) as any} className="text-xs">
                  {sprint.status}
                </Badge>
              </div>

              {sprint.goal && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 line-clamp-2">
                  {sprint.goal}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-muted-foreground mb-3">
                <span>
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </span>
                <span>{sprint.workItems.length} items</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                {sprint.status === 'PLANNED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSprintAction(sprint._id, 'start');
                    }}
                    disabled={updateSprintMutation.isPending}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                )}

                {sprint.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSprintToComplete(sprint);
                      setCompleteSprintDialogOpen(true);
                    }}
                    disabled={updateSprintMutation.isPending}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                )}

                {sprint.status === 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSprintAction(sprint._id, 'reopen');
                    }}
                    disabled={updateSprintMutation.isPending}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reopen
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(sprint);
                  }}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Do you want to delete the Sprint')) {
                      deleteSprintMutation.mutate(
                        { sprintId: sprint._id, workspaceId },
                        {
                          onSuccess: () => {
                            toast({ title: 'Deleted', description: 'Sprint deleted Succusfully' });
                          },
                          onError: () => {
                            toast({ title: 'Error', description: 'Sprint not deleted', variant: 'destructive' });
                          },
                        }
                      );
                    }
                  }}
                  disabled={deleteSprintMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {sprints.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No sprints yet</p>
            <p className="text-sm">Create your first sprint to get started</p>
          </div>
        )}
      </div>

      {/* Sprint Creation Dialog */}
      <SprintCreationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {editTarget && (
        <SprintEditDialog
          sprint={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Complete Sprint Dialog */}
      {sprintToComplete && (
        <CompleteSprintDialog
          open={completeSprintDialogOpen}
          onClose={() => {
            setCompleteSprintDialogOpen(false);
            setSprintToComplete(null);
          }}
          sprint={sprintToComplete}
          otherSprints={sprints.filter((s) => s._id !== sprintToComplete._id && s.status !== 'COMPLETED')}
          onConfirm={(targetSprintId) => {
            handleSprintAction(sprintToComplete._id, 'complete', targetSprintId);
            setCompleteSprintDialogOpen(false);
            setSprintToComplete(null);
          }}
          isLoading={updateSprintMutation.isPending}
        />
      )}
    </div>
  );
};

export default SprintList;
