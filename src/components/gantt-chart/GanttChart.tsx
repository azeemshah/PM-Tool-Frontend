import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGanttData } from './hooks/useGanttData';
import { useGanttFilters } from './hooks/useGanttFilters';
import { useTimelineCalculations } from './hooks/useTimelineCalculations';
import { TimelineHeader } from './TimelineHeader';
import { GanttRow } from './GanttRow';
import { enrichTreeWithPositions } from './utils/ganttCalculations';

interface GanttChartProps {
  workspaceId: string;
  onTaskClick?: (taskId: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  workspaceId,
  onTaskClick,
}) => {
  const [viewType, setViewType] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { range, dateLabels } = useTimelineCalculations(viewType, currentDate);
  const { tree, isLoading, error } = useGanttData(workspaceId, viewType, range);
  const { filteredNodes } = useGanttFilters(tree);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Enrich tree with positions
  const enrichedNodes = useMemo(() => {
    return enrichTreeWithPositions([...JSON.parse(JSON.stringify(filteredNodes))], range);
  }, [filteredNodes, range]);

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleTaskClick = (id: string) => {
    onTaskClick?.(id);
  };

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${range.start.toLocaleDateString('en-US', options)} - ${range.end.toLocaleDateString('en-US', options)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 dark:border-zinc-700 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">Loading Gantt Chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <h2 className="font-bold text-red-600 dark:text-red-400 text-lg">Error loading data</h2>
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="px-6 py-4">
          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left side - View toggle & Navigation */}
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                <button
                  onClick={() => setViewType('week')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewType === 'week'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewType('month')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewType === 'month'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Month
                </button>
              </div>

              {/* Date navigation */}
              <div className="flex items-center gap-2 border border-border rounded-md px-1">
                <button
                  onClick={handlePreviousPeriod}
                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  title="Previous period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-foreground min-w-fit px-2">{formatDateRange()}</span>
                <button
                  onClick={handleNextPeriod}
                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  title="Next period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main chart area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-muted/50">
        {/* Timeline Header */}
        <TimelineHeader range={range} viewType={viewType} dateLabels={dateLabels} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {enrichedNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">No tasks found matching your filters</p>
              </div>
            </div>
          ) : (
            <div className="bg-background">
              {enrichedNodes.map((node, index) => (
                <GanttRow
                  key={node.item._id}
                  node={node}
                  isExpanded={expandedItems.has(node.item._id)}
                  onToggleExpand={handleToggleExpand}
                  onTaskClick={handleTaskClick}
                  pixelsPerDay={range.pixelsPerDay}
                  level={node.level}
                  isLastRow={index === enrichedNodes.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="border-t border-border bg-background px-6 py-3">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"></div>
            <span>Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
            <span>Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
            <span>Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"></div>
            <span>Bug</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"></div>
            <span>Subtask</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
