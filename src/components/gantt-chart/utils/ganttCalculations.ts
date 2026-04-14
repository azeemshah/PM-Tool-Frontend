import type { GanttItem, GanttTreeNode, TimelineRange } from '../types/gantt';

/**
 * Calculate timeline range for a given view and date
 */
export function getTimelineRange(
  viewType: 'week' | 'month',
  date: Date
): TimelineRange {
  let start: Date;
  let end: Date;

  if (viewType === 'week') {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  const dayCount = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const pixelsPerDay = viewType === 'week' ? 50 : 25;

  return {
    start,
    end,
    dayCount,
    pixelsPerDay,
  };
}

/**
 * Calculate bar position in pixels from timeline start
 */
export function calculateBarPosition(
  item: GanttItem,
  range: TimelineRange
): { start: number; width: number } {
  let itemStart = item.startDate ? new Date(item.startDate) : new Date(item.createdAt);
  let itemEnd = item.dueDate ? new Date(item.dueDate) : new Date(item.updatedAt);

  // Check if item is completely outside the range
  if (itemEnd < range.start || itemStart > range.end) {
    return { start: 0, width: 0 };
  }

  // Clamp to timeline range
  if (itemStart < range.start) itemStart = range.start;
  if (itemEnd > range.end) itemEnd = range.end;

  const daysFromStart = Math.max(
    0,
    (itemStart.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration = Math.max(
    1,
    (itemEnd.getTime() - itemStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const start = daysFromStart * range.pixelsPerDay;
  const width = duration * range.pixelsPerDay;

  return { start, width };
}

/**
 * Calculate progress percentage (time spent / estimate)
 */
export function calculateProgressPercent(item: GanttItem): number {
  if (!item.originalEstimate || item.originalEstimate === 0) {
    return 0;
  }
  const percent = (item.timeSpent || 0) / item.originalEstimate;
  return Math.min(100, Math.round(percent * 100));
}

/**
 * Format time (minutes to hours or days)
 */
export function formatTime(minutes?: number): string {
  if (!minutes) return '0h';
  const hours = Math.round((minutes / 60) * 10) / 10;
  if (hours >= 24) {
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days}d`;
  }
  return `${hours}h`;
}

/**
 * Enrich tree nodes with calculated positions
 */
export function enrichTreeWithPositions(
  nodes: GanttTreeNode[],
  range: TimelineRange
): GanttTreeNode[] {
  function traverse(node: GanttTreeNode) {
    // Process children first to enable aggregation
    node.children.forEach(traverse);

    // Aggregate time and estimate from children if they exist
    if (node.children.length > 0) {
      const totalTime = node.children.reduce((sum, child) => sum + (child.item.timeSpent || 0), 0);
      const totalEst = node.children.reduce((sum, child) => sum + (child.item.originalEstimate || 0), 0);
      
      // Update the parent item with aggregated values
      // This ensures the Gantt chart reflects the total effort of the subtree
      if (totalEst > 0) {
        node.item.originalEstimate = totalEst;
        node.item.timeSpent = totalTime;
      }
    }

    const pos = calculateBarPosition(node.item, range);
    node.barStart = pos.start;
    node.barWidth = pos.width;
    node.progressPercent = calculateProgressPercent(node.item);
  }

  nodes.forEach(traverse);
  return nodes;
}
