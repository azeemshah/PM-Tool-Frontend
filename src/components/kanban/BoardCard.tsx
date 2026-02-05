import { KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';
import { MessageSquare, Paperclip, ListChecks, Flag, Clock, Zap } from 'lucide-react';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { priorities, issueTypes } from '@/components/workspace/task/table/data';
import { formatStatusToEnum } from '@/lib/helper';
import { TaskPriorityEnum } from '@/constant';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import React, { useMemo } from 'react';

interface BoardCardProps {
  card: KanbanCard | Issue;
  tagsMap?: Map<string, string>;
  labelsMap?: Map<string, { name: string; color: string }>;
}

const minutesToHours = (minutes: number): string => {
  if (!minutes) return '0h';
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${Math.floor(hours)}h` : `${hours.toFixed(2)}h`;
};

export function BoardCard({ card, tagsMap, labelsMap }: BoardCardProps) {
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const members = membersData?.members || [];

  // Determine if this is an Issue or KanbanCard
  const isIssue = 'type' in card && ['epic', 'story', 'task', 'bug', 'improvement', 'subtask'].includes(String((card as any).type).toLowerCase());
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
  const cardTags = issue?.labels || (card as KanbanCard).labels || [];

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
                : 'Parent';
        hierarchyLabel = `${prefix}: ${meta.parentTitle}`;
      }
    }
  }

  return (
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group">
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
              {minutesToHours((card as any).timeSpent)}
            </Badge>
          )}
        </div>
      </div>

      {/* Labels */}
      {
        cardTags && cardTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 items-center">
            <span className="text-[10px] text-gray-500 font-medium mr-1">Labels:</span>
            {cardTags.slice(0, 3).map((label: any) => {
              const labelId = typeof label === 'string' ? label : (label._id || label.id);
              let labelText = typeof label === 'string' ? label : (label.name || label.label || 'Unknown');
              let labelColor = '#3b82f6'; // Default blue

              if (labelsMap && labelsMap.has(labelId)) {
                const resolved = labelsMap.get(labelId)!;
                labelText = resolved.name;
                if (resolved.color) labelColor = resolved.color;
              }

              const key = labelId || labelText;

              return (
                <span
                  key={key}
                  className="inline-flex text-[10px] px-2 py-0.5 rounded-full text-white font-medium truncate max-w-[100px]"
                  style={{ backgroundColor: labelColor }}
                  title={labelText}
                >
                  {labelText}
                </span>
              );
            })}
            {cardTags.length > 3 && (
              <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                +{cardTags.length - 3}
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
          {cardPriority && (
            <div className="flex items-center">
              {(() => {
                const p = String(cardPriority).toLowerCase();
                const Icon =
                  p === 'high' || p === 'urgent'
                    ? priorities.find(x => x.value === 'high')?.icon
                    : p === 'medium'
                      ? priorities.find(x => x.value === 'medium')?.icon
                      : priorities.find(x => x.value === 'low')?.icon;

                return Icon ? (
                  <Icon className={`h-3.5 w-3.5 ${p === 'high' || p === 'urgent' ? 'text-red-500' :
                    p === 'medium' ? 'text-orange-500' : 'text-blue-500'
                    }`} />
                ) : null;
              })()}
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-muted-foreground">
            {issue && issue.issueId ? issue.issueId : ''}
          </span>

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

        {/* Reporter Avatar */}
        {(() => {
          // For Issue type
          if (issue?.reporter) {
            return (
              <div className="flex items-center">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(issue.reporter as any)?.profilePicture || ''} alt={issue.reporter?.name} />
                  <AvatarFallback className={getAvatarColor(issue.reporter?.name || '')}>
                    {getAvatarFallbackText(issue.reporter?.name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          }

          // Resolve reporter when backend returns id only or wrapped object (for KanbanCard)
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
            // render empty avatar circle to match styling if needed, or just null
            return null;
          }

          return (
            <div className="flex items-center">
              <Avatar className="h-7 w-7">
                <AvatarImage src={resolved?.profilePicture || ''} alt={resolved?.name || 'User'} />
                <AvatarFallback className={getAvatarColor(resolved?.name || '')}>
                  {resolved?.name ? getAvatarFallbackText(resolved.name) : ''}
                </AvatarFallback>
              </Avatar>
            </div>
          );
        })()}
      </div>
    </div >
  );
}





