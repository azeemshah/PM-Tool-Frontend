import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GanttTreeNode } from './types/gantt';
import { GanttBar } from './GanttBar';
import { formatTime } from './utils/ganttCalculations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ISSUE_TYPES_CONFIG } from '@/components/issue/constants';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { statusIcons } from '@/components/workspace/task/table/data';
import { statusColorMap } from './utils/colorMaps';
import { TaskStatusEnum } from '@/constant';

interface GanttRowProps {
  node: GanttTreeNode;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onTaskClick: (id: string) => void;
  pixelsPerDay: number;
  level: number;
  isLastRow?: boolean;
}

export const GanttRow: React.FC<GanttRowProps> = ({
  node,
  isExpanded,
  onToggleExpand,
  onTaskClick,
  pixelsPerDay,
  level,
  isLastRow = false,
}) => {
  const { item, children, barStart, barWidth, progressPercent } = node;
  const indentWidth = level * 24;

  const hasPriority = (priority: string) => {
    return ['High', 'Critical'].includes(priority);
  };

  return (
    <>
      <div
        className="flex border-b border-border hover:bg-muted/50 transition-colors group"
        style={{ minHeight: '32px' }}
      >
        {/* Left section: Task info */}
        <div className="w-96 flex-shrink-0 flex items-center px-4 py-1 gap-2 bg-background group-hover:bg-muted/50">
          {/* Indentation */}
          <div style={{ width: indentWidth }} />

          {/* Expand/collapse toggle */}
          <div className="flex-shrink-0">
            {children.length > 0 ? (
              <button
                onClick={() => onToggleExpand(item._id)}
                className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} strokeWidth={2} />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
          </div>

          {/* Type badge */}
          {(() => {
            const normalizedType = item.type?.toLowerCase() || '';
            const typeConfig = ISSUE_TYPES_CONFIG[normalizedType as keyof typeof ISSUE_TYPES_CONFIG];
            const Icon = typeConfig?.icon;

            return (
              <span
                className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 flex items-center gap-1 ${typeConfig?.className || 'bg-muted text-muted-foreground'
                  }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span>{typeConfig?.label || item.type}</span>
              </span>
            );
          })()}

          {/* Task title and priority indicator */}
          <div className="flex-1 min-w-0">
            {(() => {
              const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];
              const statusColors = statusColorMap[item.status] || statusColorMap[TaskStatusEnum.TO_DO];

              return (
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${statusColors.bg} ${statusColors.border} w-fit cursor-pointer`}
                  onClick={() => onTaskClick(item._id)}
                >
                  {StatusIcon && <StatusIcon className={`w-3 h-3 ${statusColors.text}`} />}
                  <span
                    className={`text-xs font-semibold ${statusColors.text} truncate block`}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                </div>
              );
            })()}
            {hasPriority(item.priority) && (
              <div className="text-xs text-red-600 dark:text-red-400 font-medium ml-7">★ {item.priority}</div>
            )}
          </div>

          {/* Assignee avatar */}
          {(() => {
            const assignee = item.assignedTo || (item as any).assignee || (item as any).reporter;
            if (!assignee) return null;

            return (
              <Avatar className="w-6 h-6 flex-shrink-0 border border-border">
                <AvatarImage src={assignee.profilePicture || assignee.avatar} alt={assignee.name} />
                <AvatarFallback className={`text-xs ${getAvatarColor(assignee.name || '')}`}>
                  {getAvatarFallbackText(assignee.name)}
                </AvatarFallback>
              </Avatar>
            );
          })()}
        </div>

        {/* Right section: Gantt bar + estimates */}
        <div className="flex-1 flex items-center px-4 py-1 relative bg-background hover:bg-muted/50">
          {/* Timeline bar */}
          <GanttBar
            item={item}
            barStart={barStart}
            barWidth={barWidth}
            progressPercent={progressPercent}
            onClick={() => onTaskClick(item._id)}
          />

          {/* Estimates (right-aligned) */}
          {item.originalEstimate && (
            <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 font-medium">
              {formatTime(item.timeSpent)} / {formatTime(item.originalEstimate)}
            </div>
          )}
        </div>
      </div>

      {/* Render children if expanded */}
      {isExpanded &&
        children.length > 0 &&
        children.map((child, idx) => (
          <GanttRow
            key={child.item._id}
            node={child}
            isExpanded={false}
            onToggleExpand={onToggleExpand}
            onTaskClick={onTaskClick}
            pixelsPerDay={pixelsPerDay}
            level={level + 1}
            isLastRow={idx === children.length - 1}
          />
        ))}
    </>
  );
};
