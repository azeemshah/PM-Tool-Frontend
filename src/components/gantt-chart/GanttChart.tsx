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
  const { tree, isLoading, error } = useGanttData(workspaceId);
  const { filters, updateFilter } = useGanttFilters(tree);
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { range, dateLabels } = useTimelineCalculations(viewType, currentDate);
  const { filteredNodes } = useGanttFilters(tree);

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
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-zinc-800">
        <div className="px-6 py-4">
          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left side - View toggle & Navigation */}
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 rounded-md p-1">
                <button
                  onClick={() => setViewType('week')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewType === 'week'
                      ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewType('month')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewType === 'month'
                      ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  Month
                </button>
              </div>

              {/* Date navigation */}
              <div className="flex items-center gap-2 border border-gray-200 dark:border-zinc-800 rounded-md px-1">
                <button
                  onClick={handlePreviousPeriod}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  title="Previous period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit px-2">{formatDateRange()}</span>
                <button
                  onClick={handleNextPeriod}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  title="Next period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right side - Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
              value={filters.searchText || ''}
              onChange={(e) => updateFilter('searchText', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main chart area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-zinc-900/50">
        {/* Timeline Header */}
        <TimelineHeader range={range} viewType={viewType} dateLabels={dateLabels} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {enrichedNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-sm">No tasks found matching your filters</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950">
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
      <div className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-3">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
            <span>Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>Bug</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>Subtask</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
