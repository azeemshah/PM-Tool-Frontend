import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { useUpdateIssue, useDeleteIssue } from '@/api/issue/hooks';
import { Issue, IssuePriority, IssueStatus } from '@/api/issue/types';
import { KanbanCard } from '@/api/kanban/types';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarColor, getAvatarFallbackText, mapColumnToStatus } from '@/lib/helper';

export function BoardCardDialog() {
  const {
    selectedCard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    setSelectedCard,
  } = useKanbanAppContext();
  const workspaceId = useWorkspaceId();
  const { boardId } = useParams<{ boardId: string }>();
  const { data: boardLists } = useGetKanbanBoardLists(boardId || null);
  const queryClient = useQueryClient();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const { toast } = useToast();

  const members = Array.isArray(membersData) ? membersData : (membersData?.members || []);

  // Check if selectedCard is actually an Issue (has 'type' field that's an issue type)
  const isIssue = selectedCard && ('type' in selectedCard) &&
    ['epic', 'story', 'task', 'bug', 'subtask'].includes(String((selectedCard as any).type));

  const issue = isIssue ? (selectedCard as Issue) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue?.title || (selectedCard as KanbanCard)?.title || '');
  const [description, setDescription] = useState(
    issue?.description || (selectedCard as KanbanCard)?.description || ''
  );
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority || 'medium');
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'to-do');
  const [assigneeId, setAssigneeId] = useState(issue?.assignee?._id || '');
  const [dueDate, setDueDate] = useState<string | null>(issue?.dueDate || null);

  const { mutate: updateIssue, isPending: isUpdating } = useUpdateIssue();
  const { mutate: deleteIssueApi, isPending: isDeleting } = useDeleteIssue();

  const normalizeStatusForColumn = (value: string | null): IssueStatus => {
    const v = (value || '').toLowerCase().replace(/\s+/g, '_');
    if (v === 'backlog') return 'to-do';
    if (v === 'todo' || v === 'to-do') return 'to-do';
    if (v === 'in_progress' || v === 'in-progress') return 'in-progress';
    if (v === 'in_review' || v === 'in-review' || v === 'review') return 'in-review';
    if (v === 'done') return 'done';
    if (v === 'blocked') return 'blocked';
    return 'to-do';
  };

  const findColumnIdForStatus = (statusValue: IssueStatus): string | null => {
    const lists = boardLists || [];
    if (!lists || lists.length === 0) return null;
    const match = (lists as any[]).find((list) => {
      const name = (list && (list as any).name) || '';
      const mapped = mapColumnToStatus(String(name));
      return mapped === statusValue;
    });
    if (!match) return null;
    const id = (match as any)._id || (match as any).id;
    return id ? String(id) : null;
  };

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setPriority(issue.priority || 'medium');
      setStatus(issue.status || 'to-do');
      setAssigneeId(issue.assignee?._id || '');
      setDueDate(issue.dueDate || null);
    }
  }, [issue]);

  if (!isCardDialogOpen || !issue) {
    return null;
  }

  const mapStatusForApi = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
      case 'to-do':
        return 'Todo';
      case 'in_progress':
      case 'in-progress':
        return 'In Progress';
      case 'in_review':
      case 'in-review':
      case 'review':
        return 'In Review';
      case 'done':
        return 'Done';
      default:
        return undefined;
    }
  };

  const mapPriorityForApi = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    switch (normalized) {
      case 'lowest':
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
      case 'highest':
        return 'high';
      default:
        return undefined;
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    const normalizedStatus = normalizeStatusForColumn(status);
    const targetColumnId = findColumnIdForStatus(normalizedStatus);
    const issueIdStr = String(issue._id);

    updateIssue(
      {
        issueId: issueIdStr,
        data: {
          title,
          description,
          status: mapStatusForApi(status),
          priority: mapPriorityForApi(priority),
          assignedTo: assigneeId || null,
          dueDate,
        },
      },
      {
        onSuccess: async (updatedIssue: Issue) => {
          setSelectedCard(updatedIssue as any);
          setTitle(updatedIssue.title);
          setDescription(updatedIssue.description || '');
          setPriority(updatedIssue.priority || 'medium');
          setStatus(updatedIssue.status || 'to-do');
          setAssigneeId(updatedIssue.assignee?._id || '');
          setDueDate(updatedIssue.dueDate || null);
          setIsEditing(false);
          toast({
            title: 'Success',
            description: 'Issue updated successfully',
          });
          if (targetColumnId && workspaceId) {
            try {
              const queryKey = ['all-tasks', 'kanban', workspaceId || 'unknown'];
              queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((item: any) => {
                  if (String(item._id) === issueIdStr) {
                    return {
                      ...item,
                      column: targetColumnId,
                    };
                  }
                  return item;
                });
              });
              await issueApiService.moveItemToColumn(issueIdStr, targetColumnId);
              queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban'] });
            } catch (error) {
              console.error('Failed to move issue to column after update:', error);
              queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban'] });
            }
          }
        },
        onError: (error: unknown) => {
          console.error('Update error:', error);
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to update issue';
          toast({
            title: 'Error',
            description: errorMessage || 'Failed to update issue',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    deleteIssueApi(
      issue._id,
      {
        onSuccess: () => {
          setIsCardDialogOpen(false);
          setSelectedCard(null);
          toast({
            title: 'Success',
            description: 'Issue deleted successfully',
          });
        },
        onError: (error: unknown) => {
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to delete issue';
          toast({
            title: 'Error',
            description: errorMessage || 'Failed to delete issue',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Issue Details</h2>
            <p className="text-sm text-gray-500 mt-1">{issue.key || `${issue.type} #${issue._id.slice(-6)}`}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
            <button
              onClick={() => {
                setIsCardDialogOpen(false);
                setSelectedCard(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Badge className="inline-block p-1 px-2 gap-1 font-medium shadow-sm capitalize">
              {issue.type}
            </Badge>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="capitalize">
                {status?.replace('-', ' ').replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {description || 'No description'}
              </p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              {isEditing ? (
                <Select value={priority} onValueChange={(value) => setPriority(value as IssuePriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowest">Lowest</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="highest">Highest</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">
                  {priority}
                </Badge>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-600">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            {isEditing ? (
              <Select value={assigneeId || 'unassigned'} onValueChange={(value) => setAssigneeId(value === 'unassigned' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <div className="w-full max-h-[200px] overflow-y-auto">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members && members.length > 0 ? (
                      members.map((member: any) => {
                        const userId = member.userId;
                        if (!userId) return null;
                        const name = userId.name || 'Unknown';
                        return (
                          <SelectItem key={userId._id} value={userId._id}>
                            <div className="flex items-center gap-2">
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No members available</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-gray-600">
                {assigneeId && members?.length > 0
                  ? members
                    .filter((member: any) => member.userId?._id === assigneeId)
                    .map((member: any) => member.userId?.name || 'Unknown')
                    .join(', ')
                  : 'Unassigned'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setTitle(issue.title);
                  setDescription(issue.description || '');
                  setPriority(issue.priority || 'medium');
                  setStatus(issue.status || 'to-do');
                  setAssigneeId(issue.assignee?._id || '');
                  setDueDate(issue.dueDate || null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
