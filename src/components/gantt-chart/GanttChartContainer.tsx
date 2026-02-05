import React, { useRef, useEffect } from 'react';
import { TimelineHeader } from './TimelineHeader';
import { GanttRow } from './GanttRow';
import { GanttTreeNode, TimelineRange } from './types/gantt';

interface GanttChartContainerProps {
  nodes: GanttTreeNode[];
  range: TimelineRange;
  dateLabels: Date[];
  viewType: 'week' | 'month';
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onTaskClick: (id: string) => void;
  isLoading?: boolean;
}

export const GanttChartContainer: React.FC<GanttChartContainerProps> = ({
  nodes,
  range,
  dateLabels,
  viewType,
  expandedItems,
  onToggleExpand,
  onTaskClick,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between timeline header and rows
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (timelineHeaderRef.current) {
        timelineHeaderRef.current.scrollLeft = container.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-3 text-gray-600 text-sm font-medium">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">No tasks found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Sticky Timeline Header */}
      <div
        ref={timelineHeaderRef}
        className="overflow-x-hidden sticky top-0 z-10"
      >
        <TimelineHeader
          range={range}
          viewType={viewType}
          dateLabels={dateLabels}
        />
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
      >
        {/* White background container for rows */}
        <div className="bg-white min-h-full">
          {nodes.map((node, index) => (
            <GanttRow
              key={node.item._id}
              node={node}
              isExpanded={expandedItems.has(node.item._id)}
              onToggleExpand={onToggleExpand}
              onTaskClick={onTaskClick}
              pixelsPerDay={range.pixelsPerDay}
              level={node.level}
              isLastRow={index === nodes.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttChartContainer;
