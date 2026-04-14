import { useMemo } from 'react';
import type { TimelineRange } from '../types/gantt';

/**
 * Hook to calculate timeline range and date labels
 * Handles week and month views with proper date calculations
 */
export function useTimelineCalculations(
  viewType: 'week' | 'month',
  currentDate: Date
): {
  range: TimelineRange;
  dateLabels: Date[];
  monthLabels: { month: string; dayStart: number; dayEnd: number }[];
} {
  const { range, dateLabels, monthLabels } = useMemo(() => {
    let start: Date;
    let end: Date;
    let dayCount: number;

    if (viewType === 'week') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(d.setDate(diff));
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      dayCount = 7;
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      end.setHours(23, 59, 59, 999);

      dayCount = end.getDate();
    }

    const labels: Date[] = [];
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      labels.push(date);
    }

    const months: { month: string; dayStart: number; dayEnd: number }[] = [];
    if (viewType === 'month') {
      const monthName = start.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      months.push({
        month: monthName,
        dayStart: 0,
        dayEnd: dayCount,
      });
    }

    const pixelsPerDay = viewType === 'week' ? 50 : 25;

    return {
      range: {
        start,
        end,
        dayCount,
        pixelsPerDay,
      },
      dateLabels: labels,
      monthLabels: months,
    };
  }, [viewType, currentDate]);

  return { range, dateLabels, monthLabels };
}
