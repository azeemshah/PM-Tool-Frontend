import React from 'react';
import { TimelineRange } from './types/gantt';

interface TimelineHeaderProps {
  range: TimelineRange;
  viewType: 'week' | 'month';
  dateLabels: Date[];
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  range,
  viewType,
  dateLabels,
}) => {
  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Group dates by week or month
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const groupedDates = dateLabels.reduce(
    (acc, date) => {
      const key = viewType === 'week' ? `W${getWeekNumber(date)}` : monthNames[date.getMonth()];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(date);
      return acc;
    },
    {} as Record<string, Date[]>
  );

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 overflow-x-hidden">
      {/* Month/Week row */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800">
        <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 px-4 py-2"></div>
        <div className="flex flex-1">
          {Object.entries(groupedDates).map(([label, dates]) => (
            <div
              key={label}
              className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 text-center"
              style={{ minWidth: dates.length * range.pixelsPerDay }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day row */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800">
        <div className="w-80 flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 px-4 py-3"></div>
        <div className="flex flex-1">
          {dateLabels.map((date, index) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div
                key={index}
                className={`flex flex-col items-center justify-center text-xs font-medium border-r border-gray-200 dark:border-zinc-800 transition-colors ${
                  isWeekend ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'
                } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                style={{ width: range.pixelsPerDay }}
              >
                <span className="text-gray-500 dark:text-gray-400 text-xs">{dayAbbreviations[date.getDay()]}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;
