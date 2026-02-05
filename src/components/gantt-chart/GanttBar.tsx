import React from 'react';
import type { GanttItem } from './types/gantt';
import { statusColorMap, issueTypeBarColors } from './utils/colorMaps';
import { formatTime } from './utils/ganttCalculations';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttBarProps {
  item: GanttItem;
  barStart: number;
  barWidth: number;
  progressPercent: number;
  onClick?: () => void;
}

export const GanttBar: React.FC<GanttBarProps> = ({
  item,
  barStart,
  barWidth,
  progressPercent,
  onClick,
}) => {
  // Use issue type colors for consistency with the rest of the UI
  const typeColors = issueTypeBarColors[item.type?.toLowerCase() || ''];
  const statusColors = statusColorMap[item.status] || statusColorMap['To Do'];

  // Prioritize type colors, fallback to status colors
  const colors = typeColors ? { ...typeColors, text: 'text-gray-900' } : statusColors;

  // Calculate effective dates for display (consistent with bar position logic)
  const effectiveStartDate = item.startDate ? new Date(item.startDate) : new Date(item.createdAt);
  const isCreatedDate = !item.startDate;

  const startDateStr = effectiveStartDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const dueDateStr = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    : 'N/A';

  if (barWidth <= 0 || barStart < 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className="relative flex items-center cursor-pointer group"
            style={{
              marginLeft: `${Math.max(0, barStart)}px`,
            }}
            onClick={onClick}
          >
            {/* Status bar */}
            <div
              className={`h-5 rounded transition-shadow shadow-sm hover:shadow-md flex items-center relative overflow-hidden ${colors.bg} ${colors.border} border`}
              style={{
                width: `${Math.max(40, barWidth)}px`,
              }}
            >
              {/* Progress bar overlay */}
              {progressPercent > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all ${colors.progressBg || 'bg-gray-400/30'}`}
                  style={{
                    width: `${Math.min(100, progressPercent)}%`,
                  }}
                />
              )}

              {/* Assignee Avatar */}
              {(() => {
                const assignee = item.assignedTo || (item as any).assignee || (item as any).reporter;
                if (!assignee) return null;

                return (
                  <Avatar className="absolute left-1 w-3.5 h-3.5 z-20 ring-1 ring-white/50 dark:ring-zinc-950/50">
                    <AvatarImage src={assignee.profilePicture || assignee.avatar} alt={assignee.name} />
                    <AvatarFallback className={`text-[6px] font-bold ${getAvatarColor(assignee.name || '')}`}>
                      {getAvatarFallbackText(assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                );
              })()}

              {/* Progress Percentage Text */}
              <span className={`absolute ${(item.assignedTo || (item as any).assignee || (item as any).reporter) ? 'left-6' : 'left-2'} text-[10px] font-semibold z-10 pointer-events-none ${colors.progressText || 'text-gray-700'}`}>
                {Math.round(progressPercent || 0)}%
              </span>
            </div>

            {/* Label outside the bar */}
            <div className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">
              {item.title}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-zinc-800 shadow-xl p-3 w-64 z-[100]"
        >
          <div className="font-semibold text-sm mb-2">{item.title}</div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Start{isCreatedDate ? ' (Created)' : ''}:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{startDateStr}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Due:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{dueDateStr}</span>
            </div>
            {item.originalEstimate && (
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Time:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(item.timeSpent)} / {formatTime(item.originalEstimate)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Progress:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(progressPercent)}%</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Status:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{item.status}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
