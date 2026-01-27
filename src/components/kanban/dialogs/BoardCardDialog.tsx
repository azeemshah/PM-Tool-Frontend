import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { useUpdateIssue, useDeleteIssue } from '@/api/issue/hooks';
import { Issue, IssuePriority, IssueStatus } from '@/api/issue/types';
import { KanbanCard } from '@/api/kanban/types';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { issueApiService } from '@/api/issue/services/issueApiService';
import API from '@/lib/axios-client';
import { uploadWorkItemAttachment, deleteAttachmentById, deleteAttachmentByUrl, getWorkItemAttachments } from '@/lib/api';
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

  // Helper to get assignee info safely from either issue.assignee or issue.assignedTo
  const getAssigneeInfo = (i: any) => {
    if (!i) return { id: '', name: '' };

    // Check assignee field
    if (i.assignee) {
      // If it's a valid object with ID
      if (typeof i.assignee === 'object') {
        const id = i.assignee._id || i.assignee.id;
        const name = i.assignee.name;

        // If we have both ID and Name, return them
        if (id && name) return { id, name };

        // If we only have ID (or name is missing/undefined), try to look up in members
        if (id) {
          const member = members.find((m: any) => (m.userId?._id === id || m.userId === id));
          if (member) return { id, name: member.userId?.name || member.name || 'Unknown' };
          // If member not found, return ID as fallback or empty name
          return { id, name: name || 'Unknown' };
        }
      }

      // If it's a string ID
      if (typeof i.assignee === 'string') {
        const id = i.assignee;
        const member = members.find((m: any) => (m.userId?._id === id || m.userId === id));
        if (member) return { id, name: member.userId?.name || member.name || 'Unknown' };
        return { id, name: 'Unknown' };
      }
    }

    // Check assignedTo field
    if (i.assignedTo) {
      if (typeof i.assignedTo === 'object') {
        const id = i.assignedTo._id || i.assignedTo.id;
        const name = i.assignedTo.name;
        if (id && name) return { id, name };
        if (id) {
          const member = members.find((m: any) => (m.userId?._id === id || m.userId === id));
          if (member) return { id, name: member.userId?.name || member.name || 'Unknown' };
          return { id, name: name || 'Unknown' };
        }
      }
      if (typeof i.assignedTo === 'string') {
        const id = i.assignedTo;
        const member = members.find((m: any) => (m.userId?._id === id || m.userId === id));
        if (member) return { id, name: member.userId?.name || member.name || 'Unknown' };
        return { id, name: 'Unknown' };
      }
    }

    return { id: '', name: '' };
  };

  // Helper to get reporter info
  const getReporterInfo = (i: any) => {
    if (!i) return { id: '', name: '' };
    if (i.reporter) {
      if (typeof i.reporter === 'object') {
        return { id: i.reporter._id || i.reporter.id || '', name: i.reporter.name || '' };
      }
      if (typeof i.reporter === 'string') {
        const member = members.find((m: any) => (m.userId?._id === i.reporter || m.userId === i.reporter));
        return { id: i.reporter, name: member?.userId?.name || member?.name || 'Unknown' };
      }
    }
    return { id: '', name: '' };
  };

  const initialAssignee = getAssigneeInfo(issue);
  const initialReporter = getReporterInfo(issue);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue?.title || (selectedCard as KanbanCard)?.title || '');
  const [description, setDescription] = useState(
    issue?.description || (selectedCard as KanbanCard)?.description || ''
  );
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority || 'medium');
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'to-do');
  const [assigneeId, setAssigneeId] = useState(initialAssignee.id);
  const [reporterId, setReporterId] = useState(initialReporter.id);
  const [dueDate, setDueDate] = useState<string | null>(issue?.dueDate || null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setAssigneeId(getAssigneeInfo(issue).id);
      setReporterId(getReporterInfo(issue).id);
      setDueDate(issue.dueDate || null);
    }
  }, [issue]);

  const issueIdStr = issue?._id ? String(issue._id) : '';
  const { data: detailedIssue } = useQuery({
    queryKey: ['issue', issueIdStr || 'unknown'],
    queryFn: () => issueApiService.getIssue(issueIdStr),
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });
  const parentIssueIdStr = issue?.parentIssueId ? String(issue.parentIssueId) : '';
  const { data: workItemAttachments = [] } = useQuery({
    queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'],
    queryFn: async () => {
      if (!issueIdStr) return [];
      try {
        const resp = await API.get(`/kanban/files/work-item/${issueIdStr}`);
        const data = resp.data?.data || resp.data || [];
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });
  const { data: workItemAttachmentsFallback = [] } = useQuery({
    queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'],
    queryFn: async () => {
      if (!issueIdStr) return [];
      try {
        const data = await getWorkItemAttachments(issueIdStr);
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });
  const { data: parentAttachments = [] } = useQuery({
    queryKey: ['attachments', 'parent-work-item', parentIssueIdStr || 'none'],
    queryFn: async () => {
      if (!parentIssueIdStr) return [];
      try {
        const resp = await API.get(`/kanban/files/work-item/${parentIssueIdStr}`);
        const data = resp.data?.data || resp.data || [];
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!parentIssueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });
  const normalize = (list: any[]) =>
    (Array.isArray(list) ? list : []).map((a: any) => ({
      _id: a?._id || a?.id || `${a?.fileUrl || ''}-${a?.fileName || ''}`,
      name: a?.name || a?.fileName || '',
      url: a?.url || a?.fileUrl || '',
    }));
  const fromIssue = normalize(((detailedIssue as any)?.attachments || []));
  const ownAttachments = (() => {
    const seen = new Set<string>();
    const arr = [...normalize(workItemAttachments), ...normalize(workItemAttachmentsFallback), ...fromIssue].filter((a) => {
      const key = a._id || a.url || a.name;
      if (seen.has(String(key))) return false;
      seen.add(String(key));
      return !!(a.url || a.name);
    });
    return arr;
  })();
  const parentOnlyAttachments = (() => {
    const ownKeys = new Set(ownAttachments.map((a) => String(a._id || a.url || a.name)));
    return normalize(parentAttachments).filter((a) => {
      const key = String(a._id || a.url || a.name);
      return !!(a.url || a.name) && !ownKeys.has(key);
    });
  })();

  const buildFullUrl = (url: string) => {
    const base = (API as any)?.defaults?.baseURL || '';
    try {
      return new URL(url, base).toString();
    } catch {
      return `${base}${url}`;
    }
  };
  const toOpenUrl = (fullUrl: string, fileName?: string) => {
    const source = String(fileName || fullUrl).toLowerCase();
    const match = source.match(/\.([a-z0-9]+)(?:$|\?|\#)/);
    const ext = match ? match[1] : '';
    const office = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (office.includes(ext)) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fullUrl)}`;
    }
    return fullUrl;
  };

  if (!isCardDialogOpen || !issue) {
    return null;
  }

  const mapStatusForSprint = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'backlog':
      case 'todo':
      case 'to-do':
        return 'To Do';
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
        return value;
    }
  };

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
          reporter: reporterId || null,
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
          if (workspaceId) {
            const sprintKey = ['workspace-items', workspaceId];
            const mappedSprintStatus = mapStatusForSprint(updatedIssue.status || '');
            queryClient.setQueryData(sprintKey, (old: any[] | undefined) => {
              if (!old) return old;
              return old.map((item: any) => {
                if (String(item._id) === issueIdStr) {
                  return {
                    ...item,
                    title: updatedIssue.title,
                    description: updatedIssue.description || '',
                    priority: updatedIssue.priority || item.priority,
                    status: mappedSprintStatus ?? item.status,
                    assignedTo: updatedIssue.assignee
                      ? {
                        _id: (updatedIssue.assignee as any)._id,
                        name: (updatedIssue.assignee as any).name,
                        profilePicture: (updatedIssue.assignee as any).profilePicture ?? null,
                      }
                      : null,
                    reporter: updatedIssue.reporter
                      ? {
                        _id: (updatedIssue.reporter as any)._id,
                        name: (updatedIssue.reporter as any).name,
                        profilePicture: (updatedIssue.reporter as any).profilePicture ?? null,
                      }
                      : null,
                    dueDate: updatedIssue.dueDate || item.dueDate || null,
                  };
                }
                return item;
              });
            });
            queryClient.invalidateQueries({ queryKey: sprintKey });
          }
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
      <div className="bg-white dark:bg-card dark:border-border dark:text-foreground rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-border">
          <div>
            <h2 className="text-xl font-bold dark:text-foreground">Issue Details</h2>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">{issue.key || `${issue.type} #${issue._id.slice(-6)}`}</p>
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
              className="text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-foreground"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">{title}</h3>
            )}
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <Badge className="inline-block p-1 px-2 gap-1 font-medium shadow-sm capitalize">
              {issue.type}
            </Badge>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardLists && boardLists.length > 0 ? (
                    boardLists.map((list: any) => (
                      <SelectItem key={list._id} value={list.name}>
                        {list.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </>
                  )}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-muted/50 rounded-md text-sm text-gray-700 dark:text-foreground min-h-[100px] whitespace-pre-wrap">
                {description || 'No description provided.'}
              </div>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-600 dark:text-muted-foreground">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Reporter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reporter *
            </label>
            {isEditing ? (
              <Select value={reporterId || ''} onValueChange={(value) => setReporterId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reporter" />
                </SelectTrigger>
                <SelectContent>
                  <div className="w-full max-h-[200px] overflow-y-auto">
                    {members && members.length > 0 ? (
                      members.map((member: any) => {
                        const userId = member.userId;
                        if (!userId) return null;
                        const name = userId.name || 'Unknown';
                        return (
                          <SelectItem key={userId._id} value={userId._id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={userId.profilePicture || ''} />
                                <AvatarFallback className={getAvatarColor(name)}>
                                  {getAvatarFallbackText(name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No members found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {reporterId ? (() => {
                  const reporterName = getReporterInfo(issue).name;
                  const member = members.find((m: any) => m.userId?._id === reporterId || m.userId === reporterId);
                  const name = member?.userId?.name || reporterName || 'Unknown';
                  const profilePicture = member?.userId?.profilePicture;

                  return (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profilePicture || ''} />
                        <AvatarFallback className={getAvatarColor(name)}>
                          {getAvatarFallbackText(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900 dark:text-foreground">{name}</span>
                    </>
                  );
                })() : (
                  <span className="text-gray-500 dark:text-muted-foreground">No reporter</span>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            {isEditing && (
              <div className="flex items-center gap-3 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file || !issueIdStr) return;
                    setIsUploadingAttachment(true);
                    try {
                      const resp = await uploadWorkItemAttachment({ workItemId: issueIdStr, file });
                      const ok = resp?.success || resp?.url;
                      if (ok) {
                        queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'] });
                        queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'] });
                        toast({ title: 'Success', description: 'Attachment uploaded' });
                      } else {
                        toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
                      }
                    } catch (err) {
                      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
                    } finally {
                      setIsUploadingAttachment(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploadingAttachment}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                >
                  {isUploadingAttachment ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            )}
            <div className="space-y-4">
              {parentOnlyAttachments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Parent attachments</div>
                  {parentOnlyAttachments.map((att: any, idx: number) => {
                    const name = att.name || att.fileName || `Attachment ${idx + 1}`;
                    const url = att.url || att.fileUrl || '';
                    const fullUrl = toOpenUrl(buildFullUrl(url), name);
                    return (
                      <div key={`parent-${idx}`} className="flex items-center gap-2">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {name}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Subtask attachments</div>
                {ownAttachments.length > 0 ? (
                  ownAttachments.map((att: any, idx: number) => {
                    const name = att.name || att.fileName || `Attachment ${idx + 1}`;
                    const url = att.url || att.fileUrl || '';
                    const fullUrl = toOpenUrl(buildFullUrl(url), name);
                    return (
                      <div key={`own-${idx}`} className="flex items-center gap-2">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {name}
                        </a>
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={!!deletingAttachmentId}
                            onClick={async () => {
                              const id = att._id || att.id;
                              const delKey = id ? String(id) : (att.url || att.fileUrl || '');
                              if (!delKey) return;
                              setDeletingAttachmentId(delKey);
                              try {
                                if (id) {
                                  await deleteAttachmentById(String(id));
                                } else if (att.url || att.fileUrl) {
                                  await deleteAttachmentByUrl(String(att.url || att.fileUrl));
                                }
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'] });
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'] });
                                toast({ title: 'Deleted', description: 'Attachment removed' });
                              } catch (err) {
                                toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
                              } finally {
                                setDeletingAttachmentId(null);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500">No subtask attachments</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-6 border-t dark:border-border">
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
