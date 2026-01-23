import React from 'react';
import { KanbanCard } from '@/api/kanban/types';
import { Issue, TaskType } from '@/api/issue/types';
import { MessageSquare, Paperclip, ListChecks } from 'lucide-react';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { priorities, issueTypes } from '@/components/workspace/task/table/data';
import { formatStatusToEnum } from '@/lib/helper';
import { TaskPriorityEnum } from '@/constant';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

interface WorkItemCardProps {
  card: KanbanCard | Issue | TaskType;
  onClick?: () => void;
}

const WorkItemCard: React.FC<WorkItemCardProps> = ({ card, onClick }) => {
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const members = membersData?.members || [];

  // Determine if this is an Issue or KanbanCard
  const isIssue = 'type' in card && ['epic', 'story', 'task', 'bug', 'subtask'].includes(String((card as any).type));
  const issue = isIssue ? (card as Issue) : null;

  // Get card properties (handle both Issue and KanbanCard)
  const cardType = issue?.type || (card as KanbanCard).type || 'task';
  const cardTitle = issue?.title || (card as KanbanCard).title || '';
  const cardPriority = issue?.priority || (card as KanbanCard).priority || '';
  const cardAssignee = issue?.assignee || (card as any)?.assignee;
  const cardComments = issue?.comments || (card as KanbanCard).comments || [];
  const cardAttachments = issue?.attachments || (card as KanbanCard).attachments || [];
  const cardChecklists = (card as KanbanCard).checklists || [];

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
    if (['story', 'task', 'bug'].includes(t)) {
      if (meta.epicTitle) {
        hierarchyLabel = `Epic: ${meta.epicTitle}`;
      }
    } else if (t === 'subtask') {
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      {/* Top row: type badge */}
      <div className="flex items-center justify-between mb-2">
        <div>
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
                <Badge className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm capitalize">
                  {typeValue}
                </Badge>
              );
            }

            const Icon = issueType.icon;

            return (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border-0 ${issueType.className}`}
              >
                <Icon className="h-4 w-4 text-inherit" />
                <span className="capitalize">{issueType.label}</span>
              </Badge>
            );
          })()}
        </div>
        
      </div>

      {/* Labels */}
      {(card as KanbanCard).labels && (card as KanbanCard).labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {(card as KanbanCard).labels.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="inline-flex text-sm px-3 py-1 rounded text-white bg-blue-500"
            >
              {labelId}
            </span>
          ))}
          {(card as KanbanCard).labels.length > 3 && (
            <span className="inline-flex text-sm px-3 py-1 rounded text-gray-600 bg-gray-100">
              +{(card as KanbanCard).labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 line-clamp-3 mb-3">
        {cardTitle}
      </h4>

      {hierarchyLabel && (
        <p className="text-xs text-gray-500 mb-2">
          {hierarchyLabel}
        </p>
      )}

      {/* Footer with icons, priority and assignee */}
      <div className="flex items-center justify-between text-xs text-gray-500">
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

        {/* Assignee Avatar */}
        {(() => {
          // For Issue type
          if (issue?.assignee) {
            return (
              <div className="flex items-center">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(issue.assignee as any)?.profilePicture || ''} alt={issue.assignee?.name} />
                  <AvatarFallback className={getAvatarColor(issue.assignee?.name || '')}>
                    {getAvatarFallbackText(issue.assignee?.name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          }

          // Resolve assignee when backend returns id only or wrapped object (for KanbanCard)
          const a = (card as any).assignee;
          let resolved: any = null;
          if (!a) return null;
          if (typeof a === 'string') {
            const m = members.find((mem: any) => String(mem.userId?._id) === String(a));
            resolved = m?.userId || null;
          } else if (a.userId) {
            resolved = a.userId;
          } else {
            resolved = a;
          }

          if (!resolved) {
            // render empty avatar circle to match styling
            return (
              <div className="flex items-center">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className={getAvatarColor('')}>{''}</AvatarFallback>
                </Avatar>
              </div>
            );
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
    </div>
  );
};

export default WorkItemCard;
