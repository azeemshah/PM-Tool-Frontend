import { ScrumboardCard } from '@/api/scrumboard/types';
import { Issue } from '@/api/issue/types';
import { MessageSquare, Paperclip, ListChecks } from 'lucide-react';
import { useGetScrumboardBoards } from '@/api/scrumboard/hooks/boards/useGetScrumboardBoards';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { priorities } from '@/components/workspace/task/table/data';
import { formatStatusToEnum } from '@/lib/helper';
import { TaskPriorityEnum } from '@/constant';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

interface BoardCardProps {
  card: ScrumboardCard | Issue;
}

export function BoardCard({ card }: BoardCardProps) {
  const { data: boards = [] } = useGetScrumboardBoards();
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const members = membersData?.members || [];

  // Determine if this is an Issue or ScrumboardCard
  const isIssue = 'type' in card && ['epic', 'story', 'task', 'bug', 'subtask'].includes(String((card as Record<string, unknown>).type));
  const issue = isIssue ? (card as Issue) : null;

  // Get card properties (handle both Issue and ScrumboardCard)
  const cardType = issue?.type || (card as ScrumboardCard).type || 'task';
  const cardTitle = issue?.title || (card as ScrumboardCard).title || '';
  const cardPriority = issue?.priority || (card as ScrumboardCard).priority || '';
  const cardStatus = issue?.status || (card as ScrumboardCard).status || '';
  const cardAssignee = issue?.assignee || (card as any)?.assignee;
  const cardComments = issue?.comments || (card as ScrumboardCard).comments || [];
  const cardAttachments = issue?.attachments || (card as ScrumboardCard).attachments || [];
  const cardChecklists = (card as ScrumboardCard).checklists || [];

  const hasComments = (cardComments?.length || 0) > 0;
  const hasAttachments = (cardAttachments?.length || 0) > 0;
  const hasChecklists = (cardChecklists?.length || 0) > 0;
  const completedChecklistItems = cardChecklists?.reduce((count, checklist) => 
    count + (checklist.checkItems?.filter(item => item.checked).length || 0), 0
  ) || 0;
  const totalChecklistItems = cardChecklists?.reduce((count, checklist) => 
    count + (checklist.checkItems?.length || 0), 0
  ) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group">
      {/* Top row: type (left) and project emoji (right) */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <Badge className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm capitalize">
            {cardType}
          </Badge>
        </div>
        <div className="text-xs text-gray-400">
          {/* Show only emoji or image for project/board, fallback to initial in a circle */}
          {(() => {
            const boardObj = boards.find((b: any) => String(b._id) === String((card as any).board));

            // Determine a project id candidate from various card/board shapes
            let projectIdCandidate: string | null = null;

            // card.project may be string id or populated object
            if ((card as any)?.project) {
              if (typeof (card as any).project === 'string') projectIdCandidate = (card as any).project;
              else if ((card as any).project._id) projectIdCandidate = (card as any).project._id;
            }

            // explicit projectId field on card/issue
            if (!projectIdCandidate && (card as any)?.projectId) projectIdCandidate = (card as any).projectId;

            // board may reference a project
            if (!projectIdCandidate && boardObj) {
              if (boardObj.project && typeof boardObj.project === 'string') projectIdCandidate = boardObj.project;
              else if (boardObj.project?._id) projectIdCandidate = boardObj.project._id;
              else if (boardObj.projectId) projectIdCandidate = boardObj.projectId;
            }

            // find project from workspace projects list
            const projectObj = projectIdCandidate ? projects.find((p: any) => String(p._id) === String(projectIdCandidate)) : ((card as any).project && typeof (card as any).project === 'object' ? (card as any).project : null) || (boardObj && (boardObj.project || null));

            const projectEmojiRaw = projectObj?.emoji || projectObj?.icon || projectObj?.emojiUrl || boardObj?.emoji || boardObj?.icon || '';

            if (projectEmojiRaw) {
              const isUrl = typeof projectEmojiRaw === 'string' && /^(https?:)?\/\//.test(projectEmojiRaw);
              const isImageExt = typeof projectEmojiRaw === 'string' && /\.(png|jpe?g|gif|svg)$/i.test(projectEmojiRaw);

              if (isUrl || isImageExt) {
                const src = projectEmojiRaw.startsWith('http') || projectEmojiRaw.startsWith('//') ? projectEmojiRaw : projectEmojiRaw;
                return (
                  <img
                    src={src}
                    alt={projectObj?.name || boardObj?.name || 'project'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                );
              }

              // Treat as unicode emoji or short text
              if (typeof projectEmojiRaw === 'string' && projectEmojiRaw.trim().length <= 3) {
                return (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    <span className="leading-none">{projectEmojiRaw}</span>
                  </div>
                );
              }
            }

            // if project exists but no emoji, avoid showing unrelated fallback initial
            if (projectObj) {
              return null;
            }

            const fallbackInitial = (boardObj?.name && boardObj.name.charAt(0)) || (cardTitle && cardTitle.charAt(0));
            if (fallbackInitial) {
              return (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-700">
                  {fallbackInitial.toUpperCase()}
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>

      {/* Labels */}
      {(card as ScrumboardCard).labels && (card as ScrumboardCard).labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {(card as ScrumboardCard).labels.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="inline-flex text-sm px-3 py-1 rounded text-white bg-blue-500"
            >
              {labelId}
            </span>
          ))}
          {(card as ScrumboardCard).labels.length > 3 && (
            <span className="inline-flex text-sm px-3 py-1 rounded text-gray-600 bg-gray-100">
              +{(card as ScrumboardCard).labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 line-clamp-3 mb-3">
        {cardTitle}
      </h4>

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
                  <AvatarImage src={issue.assignee?.email || ''} alt={issue.assignee?.name} />
                  <AvatarFallback className={getAvatarColor(issue.assignee?.name || '')}>
                    {getAvatarFallbackText(issue.assignee?.name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          }

          // Resolve assignee when backend returns id only or wrapped object (for ScrumboardCard)
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
}
