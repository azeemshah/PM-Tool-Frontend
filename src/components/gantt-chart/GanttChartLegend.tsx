import React from 'react';
import { statusColorMap } from './utils/colorMaps';

interface GanttChartLegendProps {
  pixelsPerDay?: number;
  viewType?: 'week' | 'month';
}

export const GanttChartLegend: React.FC<GanttChartLegendProps> = ({
  pixelsPerDay = 50,
  viewType = 'week',
}) => {
  const timelineScale =
    viewType === 'week' ? `${pixelsPerDay}px per day` : `${pixelsPerDay}px per day`;

  const statuses = [
    { key: 'To Do', label: 'To Do' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'In Review', label: 'In Review' },
    { key: 'Done', label: 'Done' },
    { key: 'Blocked', label: 'Blocked' },
    { key: 'Backlog', label: 'Backlog' },
    { key: 'Closed', label: 'Closed' },
  ];

  return (
    <div className="bg-background">
      <div className="flex items-center gap-4 flex-wrap min-w-fit">
        {/* Legend label */}
        <span className="font-semibold text-foreground text-sm">Status:</span>

        {/* Status color indicators */}
        <div className="flex items-center gap-4 flex-wrap">
          {statuses.map((status) => {
            const colorConfig = statusColorMap[status.key as keyof typeof statusColorMap];
            if (!colorConfig) return null;

            return (
              <div key={status.key} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded border ${colorConfig.bg || colorConfig.bgColor} ${colorConfig.border || colorConfig.borderColor}`}
                />
                <span className="text-xs text-muted-foreground font-medium">{status.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChartLegend;
