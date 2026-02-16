import React, { useMemo, useState, useRef } from 'react';
import { KanbanCard } from '@/api/kanban/types';
import { Issue, TaskType, UpdateIssueDTO } from '@/api/issue/types';
import { MessageSquare, Paperclip, ListChecks, Flag, Clock, Zap, ArrowRight, AtSign, X } from 'lucide-react';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { priorities, issueTypes } from '@/components/workspace/task/table/data';
import { formatStatusToEnum } from '@/lib/helper';
import { TaskPriorityEnum } from '@/constant';
import { getAvatarColor, getAvatarFallbackText, formatDuration, getProfileImageUrl } from '@/lib/helper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { toast } from '@/hooks/use-toast';
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { getStatusIcon } from '@/components/workspace/task/table/data';
import { getGanttStatusColor } from '@/components/gantt-chart/utils/colorMaps';
import { TimerContext } from '@/components/workspace/task/timer-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from '@/components/ui/textarea';
import { useGetComments, useCreateComment } from '@/api/comment/hooks';
import useAuth from '@/hooks/api/use-auth';
import { commentApiService } from '@/api/comment/services/commentApiService';
import { formatDistanceToNow } from 'date-fns';


interface WorkItemCardProps {
  card: KanbanCard | Issue | TaskType;
  onClick?: () => void;
  boardId?: string;
  availableStatuses?: { label: string; value: string }[];
  hideMoveIcon?: boolean;
}

const WorkItemCard: React.FC<WorkItemCardProps> = ({ card, onClick, boardId, availableStatuses, hideMoveIcon }) => {
  const workspaceId = useWorkspaceId();
  const { activeTimer, elapsedSeconds } = React.useContext(TimerContext);
  const { statuses: fetchedStatuses } = useGetWorkspaceStatuses(workspaceId, boardId);
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const members = membersData?.members || [];

  const dynamicStatuses = availableStatuses || fetchedStatuses;

  const { data: boardLabels = [] } = useGetKanbanBoardLabels(boardId || null);
  const labelsMap = useMemo(() => {
    return new Map(boardLabels.map((l) => [l._id, l]));
  }, [boardLabels]);

  const queryClient = useQueryClient();

  const updateWorkItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Pick<UpdateIssueDTO, 'status'> }) =>
      issueApiService.updateItem(itemId, data),
    onSuccess: (updatedItem) => {
      // Update the cache with the actual server response for workspace-items
      queryClient.setQueryData<any[]>(['workspace-items', workspaceId], (old) => {
        if (!old) return [updatedItem];
        return old.map((item) => item._id === updatedItem._id ? updatedItem : item);
      });

      queryClient.invalidateQueries({ queryKey: ['gantt-data', workspaceId] });
      queryClient.refetchQueries({ queryKey: ['sprints', workspaceId] });
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  });

  // Determine if this is an Issue or KanbanCard
  const isIssue = 'type' in card && ['epic', 'story', 'task', 'bug', 'improvement', 'subtask'].includes(String((card as any).type));
  const issue = isIssue ? (card as Issue) : null;

  // Get card properties (handle both Issue and KanbanCard)
  const cardType = issue?.type || (card as KanbanCard).type || 'task';
  const cardTitle = issue?.title || (card as KanbanCard).title || '';
  const cardPriority = issue?.priority || (card as KanbanCard).priority || '';
  const cardAssignee = issue?.assignee || (card as any)?.assignee;
  const cardComments = issue?.comments || (card as KanbanCard).comments || [];
  const cardAttachments = issue?.attachments || (card as KanbanCard).attachments || [];
  const cardChecklists = (card as KanbanCard).checklists || [];

  const cardDueDate = issue?.dueDate || (card as any)?.dueDate;
  const cardStatus = issue?.status || (card as any)?.status;

  const isOverdue = useMemo(() => {
    if (!cardDueDate) return false;
    const due = new Date(cardDueDate);
    const now = new Date();
    // Assuming status normalization is consistent
    const statusEnum = formatStatusToEnum(String(cardStatus || ''));
    return due < now && statusEnum !== 'DONE';
  }, [cardDueDate, cardStatus]);

  const hasComments = (cardComments?.length || 0) > 0;
  const hasAttachments = (cardAttachments?.length || 0) > 0;
  const hasChecklists = (cardChecklists?.length || 0) > 0;
  const completedChecklistItems = cardChecklists?.reduce((count, checklist) =>
    count + (checklist.checkItems?.filter(item => item.checked).length || 0), 0
  ) || 0;
  const totalChecklistItems = cardChecklists?.reduce((count, checklist) =>
    count + (checklist.checkItems?.length || 0), 0
  ) || 0;

  const meta: any = card as any;
  let hierarchyLabel: string | null = null;

  if (issue) {
    const t = String(issue.type || '').toLowerCase();
    if (t === 'subtask') {
      if (meta.parentTitle) {
        const parentType = meta.parentType ? String(meta.parentType).toLowerCase() : '';
        const prefix =
          parentType === 'story'
            ? 'Story'
            : parentType === 'task'
              ? 'Task'
              : parentType === 'bug'
                ? 'Bug'
                : parentType === 'improvement'
                  ? 'Improvement'
                  : 'Parent';
        hierarchyLabel = `${prefix}: ${meta.parentTitle}`;
      }
    }
  }

  const issueId = issue?._id ? String(issue._id) : '';
  const workItemId = issueId || String((meta._id || meta.id || ''));

  const { data: commentsData, isLoading: isCommentsLoading } = useGetComments(workItemId);
  const { data: authData } = useAuth();
  const currentUser = authData?.user;
  const currentUserId = currentUser?.id || currentUser?._id;

  const [newQuickComment, setNewQuickComment] = useState('');
  const [quickAttachments, setQuickAttachments] = useState<{ fileName: string; fileUrl: string; fileType?: string }[]>([]);
  const [quickMentionOpen, setQuickMentionOpen] = useState(false);
  const [quickErrorMsg, setQuickErrorMsg] = useState<string | null>(null);
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

  const mentionMembers = useMemo(() => {
    const rawMembers = Array.isArray(membersData) ? membersData : (membersData?.members || []);
    return rawMembers
      .map((m: any) => m.user || m.userId)
      .filter((u: any) => u && (u._id || typeof u === 'string'));
  }, [membersData]);

  const recentComments = useMemo(() => {
    if (!commentsData || !Array.isArray(commentsData)) return [];
    const sorted = [...commentsData].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, 2);
  }, [commentsData]);

  const getCommentUserName = (u: any) => {
    if (!u) return 'Unknown User';
    if (typeof u === 'string') return 'Unknown User';
    if (u.name) return u.name;
    if (u.username) return u.username;
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return 'Unknown User';
  };

  const handleQuickFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setQuickErrorMsg('File size must be less than 2MB');
        if (quickFileInputRef.current) quickFileInputRef.current.value = '';
        return;
      }
      setIsQuickUploading(true);
      try {
        if (!workItemId) return;
        const result = await commentApiService.uploadAttachment(workItemId, file);
        if (result.success || result.url) {
          setQuickAttachments(prev => [
            ...prev,
            { fileName: result.fileName, fileUrl: result.url, fileType: file.type },
          ]);
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      } finally {
        setIsQuickUploading(false);
        if (quickFileInputRef.current) quickFileInputRef.current.value = '';
      }
    }
  };

  const removeQuickAttachment = (index: number) => {
    setQuickAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertQuickMention = (memberName: string) => {
    setNewQuickComment(prev => prev + `@${memberName} `);
    setQuickMentionOpen(false);
  };

  const { mutate: createQuickComment, isPending: isCreatingQuickComment } = useCreateComment();

  const handleQuickSubmit = () => {
    if (!workItemId) return;
    if (!currentUserId) return;
    if (!newQuickComment.trim() && quickAttachments.length === 0) return;
    createQuickComment({
      workItemId,
      content: newQuickComment,
      userId: currentUserId,
      attachments: quickAttachments,
    });
    setNewQuickComment('');
    setQuickAttachments([]);
  };

  const stopFooterEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      {/* Top row: type badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {(() => {
            const typeValue = String(cardType || '').trim();
            const normalizedType = typeValue.toLowerCase();
            const issueType = issueTypes.find(
              (t) =>
                t.value.toLowerCase() === normalizedType ||
                t.label.toLowerCase() === normalizedType
            );

            if (!issueType) {
              return (
                <Badge variant="outline" className="uppercase text-[10px] px-2 py-0.5">
                  {cardType}
                </Badge>
              );
            }

            const Icon = issueType.icon;
            return (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md shadow-sm border-0 ${issueType.className}`}
              >
                <Icon className="h-3 w-3 text-inherit" />
                <span className="capitalize">{issueType.label}</span>
              </Badge>
            );
          })()}

          {isOverdue && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md shadow-sm border-0 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
            >
              <Flag className="h-3 w-3 text-inherit" />
              <span className="capitalize">Overdue</span>
            </Badge>
          )}
        </div>

        {/* Story points and time tracking badges */}
        <div className="flex items-center gap-1">
          {(card as any)?.storyPoints && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 border-0">
              <Zap className="h-3 w-3" />
              {(card as any).storyPoints}
            </Badge>
          )}
          {(card as any)?.timeSpent > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-0">
              <Clock className="h-3 w-3" />
              {formatDuration((card as any).timeSpent)}
            </Badge>
          )}

          {(() => {
            if (!activeTimer) return null;

            // Check if this card is the active one
            const activeWorkItemId = activeTimer.workItemId?._id || activeTimer.workItemId || activeTimer.issueId || activeTimer.workItem?._id || activeTimer.workItem;
            const currentCardId = (card as any)._id || (card as any).id;

            if (String(activeWorkItemId) === String(currentCardId)) {
              return (
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 shadow-sm">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span className="font-mono">{formatDuration(elapsedSeconds / 60)}</span>
                </Badge>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Labels */}
      {
        (card as KanbanCard).labels && (card as KanbanCard).labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {(card as KanbanCard).labels.slice(0, 3).map((labelId) => {
              const label = labelsMap.get(labelId);
              if (label) {
                return (
                  <span
                    key={labelId}
                    className="inline-flex text-[10px] px-2 py-0.5 rounded text-white font-medium"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                );
              }
              return (
                <span
                  key={labelId}
                  className="inline-flex text-[10px] px-2 py-0.5 rounded text-white bg-gray-400 font-medium"
                >
                  {/* Fallback to ID if not found, but maybe truncated? Or just 'Unknown' */}
                  {/* User said "ID show hu rahi", so maybe we show name if available, else ID or just ID */}
                  {/* Actually user wants name. If we can't find it, we might still show ID or slice it */}
                  {labelId.slice(0, 6)}...
                </span>
              );
            })}
            {(card as KanbanCard).labels.length > 3 && (
              <span className="inline-flex text-[10px] px-2 py-0.5 rounded text-gray-600 bg-gray-100 font-medium">
                +{(card as KanbanCard).labels.length - 3}
              </span>
            )}
          </div>
        )
      }

      {/* Title */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-foreground line-clamp-3 inline">
          {cardTitle}
        </h4>
        {meta.epicTitle && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {meta.epicTitle}
          </span>
        )}
      </div>

      {
        hierarchyLabel && (
          <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">
            {hierarchyLabel}
          </p>
        )
      }

      {/* Footer with icons, priority and assignee */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Priority badge */}
          {cardPriority && (() => {
            const cardPriorityRaw = String(cardPriority || "").trim();
            const p = priorities.find((pr: any) => {
              if (!pr) return false;
              const prVal = String(pr.value || "");
              const prLabel = String(pr.label || "");
              if (prVal === cardPriorityRaw) return true;
              if (prLabel === cardPriorityRaw) return true;
              if (prVal.toLowerCase() === cardPriorityRaw.toLowerCase()) return true;
              if (prLabel.toLowerCase() === cardPriorityRaw.toLowerCase()) return true;
              return false;
            });

            if (!p) return (
              <span className={`inline-block px-3 py-1 rounded text-white text-sm font-medium`}>{cardPriority}</span>
            );

            const statusKey = formatStatusToEnum(p.value) as keyof typeof TaskPriorityEnum;
            const Icon = p.icon;
            return (
              <Badge
                variant={TaskPriorityEnum[statusKey]}
                className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
              >
                {Icon && <Icon className="h-4 w-4 rounded-full text-inherit" />}
                <span>{p.label}</span>
              </Badge>
            );
          })()}

          {hasComments && (
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{cardComments?.length || 0}</span>
            </div>
          )}
          {hasAttachments && (
            <div className="flex items-center gap-1">
              <Paperclip size={14} />
              <span>{cardAttachments?.length || 0}</span>
            </div>
          )}
          {hasChecklists && (
            <div className="flex items-center gap-1">
              <ListChecks size={14} />
              <span>
                {completedChecklistItems}/{totalChecklistItems}
              </span>
            </div>
          )}
        </div>

        {/* Right side: Reporter + Messenger + Move Action */}
        <div
          className="flex items-center gap-2"
          onClick={stopFooterEvent}
          onMouseDown={stopFooterEvent}
          onPointerDown={stopFooterEvent}
        >
          <div className="flex items-center gap-1">
            {workItemId && (
              <Popover open={isMessengerOpen} onOpenChange={setIsMessengerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-gray-900 dark:text-foreground">Recent messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasComments && (
                        <span className="text-[11px] text-gray-500 dark:text-muted-foreground">
                          {cardComments?.length || 0} total
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsMessengerOpen(false);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {isCommentsLoading && (
                      <div className="text-xs text-gray-500 dark:text-muted-foreground">Loading comments...</div>
                    )}
                    {!isCommentsLoading && recentComments.length === 0 && (
                      <div className="text-xs text-gray-500 dark:text-muted-foreground">No comments yet.</div>
                    )}
                    {!isCommentsLoading &&
                      recentComments.map((comment: any) => (
                        <div key={comment._id} className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/40 rounded-md p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">
                              {getCommentUserName(comment.userId)}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {comment.content && (
                            <div className="whitespace-pre-wrap">
                              {comment.content.length > 120 ? `${comment.content.slice(0, 120)}…` : comment.content}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newQuickComment}
                      onChange={(e) => setNewQuickComment(e.target.value)}
                      className="min-h-[60px] text-xs bg-white dark:bg-muted/30"
                    />
                    {quickErrorMsg && (
                      <div className="text-[11px] text-red-500">{quickErrorMsg}</div>
                    )}
                    {quickAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {quickAttachments.map((att, index) => (
                          <div
                            key={`${att.fileName}-${index}`}
                            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-[11px]"
                          >
                            <Paperclip className="w-3 h-3 text-gray-500" />
                            <span className="max-w-[120px] truncate">{att.fileName}</span>
                            <button
                              type="button"
                              onClick={() => removeQuickAttachment(index)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Popover open={quickMentionOpen} onOpenChange={setQuickMentionOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              <AtSign className="w-3 h-3 mr-1" />
                              Mention
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[200px]" align="start">
                            <Command>
                              <CommandInput placeholder="Search member..." />
                              <CommandList>
                                <CommandEmpty>No member found.</CommandEmpty>
                                <CommandGroup>
                                  {mentionMembers?.map((member: any) => (
                                    <CommandItem
                                      key={member._id}
                                      value={getCommentUserName(member)}
                                      onSelect={() => insertQuickMention(getCommentUserName(member))}
                                    >
                                      <Avatar className="w-6 h-6 mr-2">
                                        <AvatarImage src={getProfileImageUrl(member.profilePicture)} />
                                        <AvatarFallback className="text-[10px]">
                                          {getAvatarFallbackText(getCommentUserName(member))}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{getCommentUserName(member)}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <input
                          type="file"
                          ref={quickFileInputRef}
                          className="hidden"
                          onChange={handleQuickFileSelect}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                          onClick={() => quickFileInputRef.current?.click()}
                          disabled={isQuickUploading}
                        >
                          <Paperclip className="w-3 h-3 mr-1" />
                          {isQuickUploading ? '...' : 'Attach'}
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={handleQuickSubmit}
                        disabled={
                          isCreatingQuickComment ||
                          isQuickUploading ||
                          (!newQuickComment.trim() && quickAttachments.length === 0) ||
                          !currentUserId
                        }
                      >
                        {isCreatingQuickComment ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {(() => {
              if (issue?.reporter) {
                return (
                  <div className="flex items-center">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={getProfileImageUrl((issue.reporter as any)?.profilePicture) || ''} alt={issue.reporter?.name} />
                      <AvatarFallback className={getAvatarColor(issue.reporter?.name || '')}>
                        {getAvatarFallbackText(issue.reporter?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              }

              const r = (card as any).reporter;
              let resolved: any = null;
              if (!r) return null;
              if (typeof r === 'string') {
                const m = members.find((mem: any) => String(mem.userId?._id) === String(r));
                resolved = m?.userId || null;
              } else if (r.userId) {
                resolved = r.userId;
              } else {
                resolved = r;
              }

              if (!resolved) {
                return null;
              }

              return (
                <div className="flex items-center">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={getProfileImageUrl(resolved?.profilePicture) || ''} alt={resolved?.name || 'User'} />
                    <AvatarFallback className={getAvatarColor(resolved?.name || '')}>
                      {resolved?.name ? getAvatarFallbackText(resolved.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            })()}
          </div>

          {/* Move Icon */}
          {!hideMoveIcon && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {dynamicStatuses.map((status) => {
                    const StatusIcon = getStatusIcon(status.value);
                    const colors = getGanttStatusColor(status.value);
                    return (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => updateWorkItemMutation.mutate({ itemId: (card as any)._id, data: { status: status.value } })}
                        className="cursor-pointer"
                      >
                        {StatusIcon && <StatusIcon className={`mr-2 h-4 w-4 ${colors.text}`} />}
                        <span>{status.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default WorkItemCard;
