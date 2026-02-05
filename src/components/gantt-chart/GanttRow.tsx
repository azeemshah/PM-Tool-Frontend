import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GanttTreeNode } from './types/gantt';
import { GanttBar } from './GanttBar';
import { formatTime } from './utils/ganttCalculations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ISSUE_TYPES_CONFIG } from '@/components/issue/constants';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

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
        className="flex border-b border-gray-100 dark:border-zinc-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors group"
        style={{ minHeight: '32px' }}
      >
        {/* Left section: Task info */}
        <div className="w-80 flex-shrink-0 flex items-center px-4 py-1 gap-2 bg-white dark:bg-zinc-950 group-hover:bg-blue-50/20 dark:group-hover:bg-blue-900/10">
          {/* Indentation */}
          <div style={{ width: indentWidth }} />

          {/* Expand/collapse toggle */}
          <div className="flex-shrink-0">
            {children.length > 0 ? (
              <button
                onClick={() => onToggleExpand(item._id)}
                className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-800 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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
                className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 flex items-center gap-1 ${typeConfig?.className || 'bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{typeConfig?.label || item.type}</span>
              </span>
            );
          })()}

          {/* Task title and priority indicator */}
          <div className="flex-1 min-w-0">
            <span
              className="truncate font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline block text-sm"
              onClick={() => onTaskClick(item._id)}
              title={item.title}
            >
              {item.title}
            </span>
            {hasPriority(item.priority) && (
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">★ {item.priority}</div>
            )}
          </div>

          {/* Assignee avatar */}
          {(() => {
            const assignee = item.assignedTo || (item as any).assignee || (item as any).reporter;
            if (!assignee) return null;

            return (
              <Avatar className="w-6 h-6 flex-shrink-0 border border-gray-200 dark:border-zinc-800">
                <AvatarImage src={assignee.profilePicture || assignee.avatar} alt={assignee.name} />
                <AvatarFallback className={`text-xs ${getAvatarColor(assignee.name || '')}`}>
                  {getAvatarFallbackText(assignee.name)}
                </AvatarFallback>
              </Avatar>
            );
          })()}
        </div>

        {/* Right section: Gantt bar + estimates */}
        <div className="flex-1 flex items-center px-4 py-1 relative bg-white dark:bg-zinc-950 hover:bg-blue-50/20 dark:hover:bg-blue-900/10">
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
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0 font-medium">
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
