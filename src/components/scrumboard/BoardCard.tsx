import { ScrumboardCard } from '@/api/scrumboard/types';
import { MessageSquare, Paperclip, ListChecks } from 'lucide-react';
import { useGetScrumboardBoards } from '@/api/scrumboard/hooks/boards/useGetScrumboardBoards';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';

interface BoardCardProps {
  card: ScrumboardCard;
}

export function BoardCard({ card }: BoardCardProps) {
  const { data: boards = [] } = useGetScrumboardBoards();
  const workspaceId = useWorkspaceId();
  const { data: projectsData } = useGetProjectsInWorkspaceQuery({ workspaceId, pageSize: 100, pageNumber: 1, skip: !workspaceId });
  const projects = projectsData?.projects || [];
  const hasComments = (card.comments?.length || 0) > 0;
  const hasAttachments = (card.attachments?.length || 0) > 0;
  const hasChecklists = (card.checklists?.length || 0) > 0;
  const completedChecklistItems = card.checklists?.reduce((count, checklist) => 
    count + (checklist.checkItems?.filter(item => item.checked).length || 0), 0
  ) || 0;
  const totalChecklistItems = card.checklists?.reduce((count, checklist) => 
    count + (checklist.checkItems?.length || 0), 0
  ) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group">
      {/* Top row: type (left) and project emoji (right) */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-1 rounded text-white bg-emerald-500">
            {card.type || 'Task'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {/* Show only emoji or image for project/board, fallback to initial in a circle */}
          {(() => {
            const boardObj = boards.find((b: any) => String(b._id) === String(card.board));

            // Prefer project info present on the card
            let projectObj = (card as any).project || null;
            // Try project id fields
            const projIdFromCard = (card as any)?.project?._id || (card as any)?.projectId || (card as any)?.projectId;
            if (!projectObj && projIdFromCard) {
              projectObj = projects.find((p: any) => String(p._id) === String(projIdFromCard)) || null;
            }

            // If board has project metadata, use it
            if (!projectObj && boardObj) {
              projectObj = boardObj.project || boardObj.projectId ? projects.find((p: any) => String(p._id) === String(boardObj.project || boardObj.projectId || boardObj.projectId)) : null;
            }

            const projectEmojiRaw = projectObj?.emoji || projectObj?.icon || projectObj?.emojiUrl || boardObj?.emoji || boardObj?.icon || '';

            if (projectEmojiRaw) {
              const isUrl = typeof projectEmojiRaw === 'string' && /^(https?:)?\/\//.test(projectEmojiRaw);
              const isImageExt = typeof projectEmojiRaw === 'string' && /\.(png|jpe?g|gif|svg)$/i.test(projectEmojiRaw);

              if (isUrl || isImageExt) {
                const src = projectEmojiRaw.startsWith('http') || projectEmojiRaw.startsWith('//') ? projectEmojiRaw : projectEmojiRaw;
                return (
                  <img
                    src={src}
                    alt={boardObj?.name || 'project'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                );
              }

              // Treat as unicode emoji or short text
              if (typeof projectEmojiRaw === 'string' && projectEmojiRaw.trim().length <= 3) {
                return <span className="text-lg">{projectEmojiRaw}</span>;
              }
            }

            const fallbackInitial = (boardObj?.name && boardObj.name.charAt(0)) || (card?.project?.name && card.project.name.charAt(0)) || (card?.title && card.title.charAt(0));
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
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="inline-flex text-xs px-2 py-1 rounded text-white bg-blue-500"
            >
              {labelId}
            </span>
          ))}
          {card.labels.length > 3 && (
            <span className="inline-flex text-xs px-2 py-1 rounded text-gray-600 bg-gray-100">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 line-clamp-3 mb-3">
        {card.title}
      </h4>

      {/* Footer with icons, priority and assignee */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Priority badge */}
          {card.priority && (
            <span
              className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded ${
                (card.priority || '').toLowerCase() === 'high'
                  ? 'bg-red-100 text-red-700'
                  : (card.priority || '').toLowerCase() === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {card.priority?.toUpperCase()}
            </span>
          )}

          {hasComments && (
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{card.comments?.length || 0}</span>
            </div>
          )}
          {hasAttachments && (
            <div className="flex items-center gap-1">
              <Paperclip size={14} />
              <span>{card.attachments?.length || 0}</span>
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

        {/* Assignee Avatar + name */}
        {card.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {card.assignee.name?.split(' ')?.map(n=>n[0])?.slice(0,2).join('')?.toUpperCase()}
            </div>
            <div className="text-xs text-gray-700 truncate max-w-[90px]">
              {card.assignee.name}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
