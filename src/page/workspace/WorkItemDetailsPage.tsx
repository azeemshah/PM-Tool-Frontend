import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { issueApiService } from '@/api/issue/services/issueApiService';
import API from '@/lib/axios-client';
import { authApiService } from '@/api/auth/services';
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
import { getAvatarColor, getAvatarFallbackText, getProfileImageUrl } from '@/lib/helper';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { CommentSection } from '@/components/kanban/dialogs/CommentSection';
import { TimeLogsList } from '@/components/time-tracking/TimeLogsList';
import { TimerButton } from '@/components/time-tracking/TimerButton';
import { TimerContext } from '@/components/workspace/task/timer-context';
import { TimeTrackingSummary } from '@/components/time-tracking/TimeTrackingSummary';
import { LabelsSelector } from '@/components/kanban/dialogs/LabelsSelector';
import { TagInput } from '@/components/tag/TagInput';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface WorkItem {
  _id: string;
  key: string;
  title: string;
  description?: string;
  type: 'epic' | 'story' | 'task' | 'bug' | 'improvement' | 'subtask';
  priority?: string;
  status?: string;
  assignee?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  reporter?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  workspaceId?: string;
  boardId?: string;
  labels?: string[];
  tags?: any[];
  epicId?: string;
  parentIssueId?: string;
  createdAt?: string;
  updatedAt?: string;
  originalEstimate?: number;
  remainingEstimate?: number;
  timeSpent?: number;
  storyPoints?: number | null;
  dueDate?: string;
}

export const WorkItemDetailsPage: React.FC = () => {
  const { workspaceId: paramWorkspaceId, workItemId } = useParams<{
    workspaceId: string;
    workItemId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use location state if available, otherwise fetch
  const initialWorkItem = location.state?.workItem;
  
  // Determine workspace ID with multiple fallbacks
  const getWorkspaceId = () => {
    if (paramWorkspaceId) return paramWorkspaceId;
    if (initialWorkItem?.workspaceId) return initialWorkItem.workspaceId;
    // Last resort: use the hook that reads from URL params
    const hookWorkspaceId = useWorkspaceId();
    return hookWorkspaceId;
  };
  
  const workspaceId = getWorkspaceId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeTimer } = React.useContext(TimerContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tags, setTags] = useState<Array<string | { _id?: string; name?: string }>>([]);
  const [selectedLabels, setSelectedLabels] = useState<Array<string | { _id?: string; name?: string; color?: string } | null>>([]);

  // Fetch work item details
  const { data: workItem, isLoading: isLoadingWorkItem } = useQuery({
    queryKey: ['workItem', workItemId],
    queryFn: async () => {
      if (initialWorkItem) {
        return initialWorkItem;
      }
      const response = await API.get(`/kanban/items/${workItemId}`);
      return response.data?.data || response.data;
    },
    enabled: !!workItemId,
  });

  // Fetch detailed work item (for full data like populated reporter)
  const { data: detailedWorkItem } = useQuery({
    queryKey: ['detailedWorkItem', workItemId],
    queryFn: async () => {
      if (!workItemId) return null;
      try {
        return await issueApiService.getIssue(workItemId);
      } catch {
        return null;
      }
    },
    enabled: !!workItemId,
  });

  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const members = Array.isArray(membersData)
    ? membersData
    : membersData?.members || [];

  const { data: boards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId = boards.length > 0 ? boards[0]._id : '';
  const boardId = (workItem?.boardId as string) || defaultBoardId;

  const { data: boardLabels = [] } = useGetKanbanBoardLabels(boardId || null);

  const { data: currentUserData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApiService.getCurrentUser,
  });

  const currentUserId = currentUserData?.user?._id || '';

  // Load time logs
  const { data: timeLogs = [], isLoading: loadingTimeLogs } = useQuery({
    queryKey: ['issue-logs', workItemId],
    queryFn: async () => {
      if (!workItemId) return [];
      const logs = await issueApiService.getIssueLogs(workItemId);
      return logs || [];
    },
    enabled: !!workItemId,
  });

  // Update form when workItem loads
  React.useEffect(() => {
    if (workItem) {
      setTitle(workItem.title || '');
      setDescription(workItem.description || '');
      setPriority(workItem.priority || '');
      setStatus(workItem.status || '');
      setAssigneeId(
        (workItem.assignee?._id ||
          workItem.assignedTo?._id ||
          '') as string
      );
      setDueDate(workItem.dueDate ? new Date(workItem.dueDate) : null);
      setTags(workItem.tags || []);
      setSelectedLabels(workItem.labels || []);
    }
  }, [workItem]);

  // Sync state when detailedWorkItem loads (similar to BoardCardDialog)
  React.useEffect(() => {
    if (detailedWorkItem) {
      setTitle(detailedWorkItem.title || '');
      setDescription(detailedWorkItem.description || '');
      setPriority(detailedWorkItem.priority || '');
      setStatus(detailedWorkItem.status || '');
      setDueDate(detailedWorkItem.dueDate ? new Date(detailedWorkItem.dueDate) : null);
      setTags(detailedWorkItem.tags || []);
      setSelectedLabels(detailedWorkItem.labels || []);
    }
  }, [detailedWorkItem]);

  // Watch for external timer stops (e.g. from sidebar or other tabs)
  const prevActiveTimerRef = React.useRef(activeTimer);
  React.useEffect(() => {
    const prev = prevActiveTimerRef.current;
    const current = activeTimer;

    const getIssueId = (timer: any) => {
      if (!timer || !timer.workItemId) return null;
      return typeof timer.workItemId === 'object' ? timer.workItemId._id : timer.workItemId;
    };

    const prevIssueId = getIssueId(prev);
    const currentIssueId = getIssueId(current);

    // If we were tracking this issue, and now we are not (stopped or switched)
    if (prevIssueId === workItemId && currentIssueId !== workItemId) {
      queryClient.invalidateQueries({ queryKey: ['issue-logs', workItemId] });
      queryClient.invalidateQueries({ queryKey: ['detailedWorkItem', workItemId] });
    }

    prevActiveTimerRef.current = current;
  }, [activeTimer, workItemId, queryClient]);

  // Helper to get reporter info
  const getReporterInfo = (i: any) => {
    if (!i) return { id: '', name: '' };
    if (i.reporter) {
      if (typeof i.reporter === 'object') {
        return { id: i.reporter._id || i.reporter.id || '', name: i.reporter.name || '' };
      }
      if (typeof i.reporter === 'string') {
        const member = members.find((m: any) => {
          const u = m.user || m.userId;
          return (u?._id === i.reporter || u === i.reporter);
        });
        const u = member?.user || member?.userId;
        const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
        return { id: i.reporter, name: n };
      }
    }
    // Fallback to Assignee (Priority per user request)
    if (i.assignee || i.assignedTo) {
         // Re-implement or reuse getAssigneeInfo logic if not available in scope, 
         // but getAssigneeInfo is defined below in this file, so we can't call it if it's defined after.
         // Wait, getReporterInfo is defined BEFORE assigneeObj in this file, and getAssigneeInfo is NOT defined as a helper function in the same way in WorkItemDetailsPage.tsx
         // In WorkItemDetailsPage.tsx, assigneeObj is a useMemo.
         // So we need to duplicate the logic here or rely on the assigneeObj logic later.
         
         // Let's implement basic extraction here
         const assigneeData = i.assignee || i.assignedTo;
         if (assigneeData) {
            let id = '';
            let name = 'Unknown';
            if (typeof assigneeData === 'object') {
               id = assigneeData._id || assigneeData.id || '';
               name = assigneeData.name || name;
               if (id && name) return { id, name };
            } else {
               id = String(assigneeData);
            }
            if (id) {
               const member = members.find((m: any) => {
                  const u = m.user || m.userId;
                  return (u?._id === id || u === id);
               });
               if (member) {
                   const u = member.user || member.userId;
                   const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
                   return { id, name: n };
               }
               return { id, name };
            }
         }
    }

    // Fallback to createdBy
    if (i.createdBy) {
      const id = typeof i.createdBy === 'object' ? (i.createdBy._id || i.createdBy.id) : i.createdBy;
       if (id) {
          const member = members.find((m: any) => {
            const u = m.user || m.userId;
            return (u?._id === id || u === id);
          });
          const u = member?.user || member?.userId;
          const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
          return { id, name: n };
       }
    }
    return { id: '', name: '' };
  };

  const reporterObj = useMemo(() => {
    const currentItem = detailedWorkItem || workItem;
    const info = getReporterInfo(currentItem);
    
    const member = members.find((m: any) => {
      const u = m.user || m.userId;
      return (u?._id === info.id || u === info.id);
    });

    const u = member?.user || member?.userId;
    // Prioritize member profile picture, fallback to item's reporter object if available and is object
    let profilePicture = u?.profilePicture;
    
    if (!profilePicture && currentItem?.reporter && typeof currentItem.reporter === 'object') {
        profilePicture = (currentItem.reporter as any).profilePicture;
    }

    return { 
        name: info.name, 
        profilePicture,
        _id: info.id 
    };
  }, [detailedWorkItem, workItem, members]);

  const parentObject = useMemo(() => {
    const item = detailedWorkItem || workItem;
    if (!item) return null;
    
    // Check for epic object
    if ((item as any).epic && typeof (item as any).epic === 'object') {
       const e = (item as any).epic;
       if (e.title || e.name) return { ...e, type: 'epic' };
    }
    
    // Check for parent object
    if ((item as any).parent && typeof (item as any).parent === 'object') {
       const p = (item as any).parent;
       if (p.title || p.name) return { ...p, type: 'story' }; 
    }
    
    // Fallback for epicTitle
    if ((item as any).epicTitle) {
        return {
           _id: (item as any).epicId || (item as any).epic || '',
           title: (item as any).epicTitle,
           type: 'epic'
        };
    }
    
    return null;
  }, [detailedWorkItem, workItem]);

  const assigneeObj = useMemo(() => {
    const currentItem = detailedWorkItem || workItem;
    const assigneeData = (currentItem as any)?.assignee ?? (currentItem as any)?.assignedTo;
    
    if (!assigneeData) return null;

    let id = '';
    let name = 'Unknown';
    let initialProfilePicture = null;

    if (typeof assigneeData === 'object') {
      id = assigneeData._id || assigneeData.id || '';
      name = assigneeData.name || name;
      initialProfilePicture = assigneeData.profilePicture;
    } else {
      id = String(assigneeData);
    }

    if (!id) return null;

    const member = members.find((m: any) => {
      const u = m.user || m.userId;
      return (u?._id === id || u === id);
    });

    const u = member?.user || member?.userId;
    
    let profilePicture = u?.profilePicture;
    if (!profilePicture && initialProfilePicture) {
        profilePicture = initialProfilePicture;
    }

    if (u) {
        name = u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : name);
    }

    return { 
        _id: id,
        name, 
        profilePicture 
    };
  }, [detailedWorkItem, workItem, members]);

  const getStatusOptions = () => {
    return [
      'To Do',
      'In Progress',
      'In Review',
      'Done',
    ];
  };

  if (isLoadingWorkItem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!workItem) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Work item not found</p>
        <Button onClick={() => navigate(`/workspace/${workspaceId}`)}>
          Back to Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title & Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <IssueTypeIcon type={workItem.type} size={24} />
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {workItem.key}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {description || 'No description'}
              </p>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comments
              </h2>
              <CommentSection
                workItemId={workItemId || ''}
                workspaceId={workspaceId}
              />
            </div>

            {/* Time Tracking */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time Tracking
              </h2>
              <TimeTrackingSummary
                issue={(detailedWorkItem as any) || workItem}
                originalEstimate={detailedWorkItem?.originalEstimate ?? workItem.originalEstimate}
                timeSpent={detailedWorkItem?.timeSpent ?? workItem.timeSpent}
                remainingEstimate={detailedWorkItem?.remainingEstimate ?? workItem.remainingEstimate}
              />
              <div className="mt-4">
                <TimerButton
                  issueId={workItemId || ''}
                  userId={currentUserId}
                  onTimerStop={() => {
                    queryClient.invalidateQueries({ queryKey: ['detailedWorkItem', workItemId] });
                    queryClient.invalidateQueries({ queryKey: ['issue-logs', workItemId] });
                  }}
                />
              </div>
              {timeLogs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Recent Time Logs ({timeLogs.length})
                  </div>
                  <TimeLogsList
                    logs={timeLogs}
                    isLoading={loadingTimeLogs}
                    currentUserId={currentUserId}
                    onLogDeleted={() => {
                      queryClient.invalidateQueries({ queryKey: ['detailedWorkItem', workItemId] });
                      queryClient.invalidateQueries({ queryKey: ['issue-logs', workItemId] });
                    }}
                    onLogUpdated={() => {
                      queryClient.invalidateQueries({ queryKey: ['detailedWorkItem', workItemId] });
                      queryClient.invalidateQueries({ queryKey: ['issue-logs', workItemId] });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Details Sidebar */}
          <div className="space-y-6">
            {/* Parent / Epic */}
            {parentObject && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {parentObject.type === 'epic' ? 'Epic' : 'Parent Issue'}
                </label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 dark:bg-muted/50">
                   <IssueTypeIcon type={parentObject.type || 'task'} />
                   <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                     {parentObject.title || parentObject.name}
                   </span>
                </div>
              </div>
            )}

            {/* Status & Priority */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Status
                </label>
                <Badge variant="outline">{status || 'N/A'}</Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Priority
                </label>
                <Badge variant="outline">{priority || 'N/A'}</Badge>
              </div>
            </div>

            {/* Assignee */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Assignee
              </label>
              {assigneeObj ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getProfileImageUrl(assigneeObj.profilePicture)} />
                    <AvatarFallback className={getAvatarColor(assigneeObj.name)}>
                      {getAvatarFallbackText(assigneeObj.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {assigneeObj.name}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Unassigned
                </p>
              )}
            </div>

            {/* Reporter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Reporter
              </label>
              {reporterObj ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getProfileImageUrl(reporterObj.profilePicture)} />
                    <AvatarFallback className={getAvatarColor(reporterObj.name)}>
                      {getAvatarFallbackText(reporterObj.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {reporterObj.name}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No reporter
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Due Date
              </label>
              {dueDate ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {format(new Date(dueDate), 'PPP')}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No due date
                </p>
              )}
            </div>

            {/* Labels */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Labels
              </label>
              {selectedLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLabels.filter(Boolean).map((label) => {
                    if (!label) return null;
                    const labelName = typeof label === 'string' ? label : (label.name ?? String((label as any)._id ?? ''));
                    const labelColor = typeof label === 'object' ? label.color : undefined;
                    const labelId = typeof label === 'string' ? label : (label._id ?? label.name ?? labelName);
                    return (
                      <Badge 
                        key={labelId}
                        variant="secondary"
                        style={{
                          backgroundColor: labelColor || '#e5e7eb',
                          color: '#374151'
                        }}
                      >
                        {labelName}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No labels
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tags
              </label>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={typeof tag === 'string' ? tag : tag._id} variant="outline">
                      {typeof tag === 'string' ? tag : tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tags
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {workItem.createdAt
                  ? format(new Date(workItem.createdAt), 'PPP p')
                  : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {workItem.updatedAt
                  ? format(new Date(workItem.updatedAt), 'PPP p')
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkItemDetailsPage;
