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
  const getWeekStartLabel = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    const monday = new Date(d.setDate(diff));
    return `Week of ${monday.toLocaleString('en-US', { month: 'short' })} ${monday.getDate()}`;
  };

  const groupedDates = dateLabels.reduce(
    (acc, date) => {
      const key = viewType === 'week' ? getWeekStartLabel(date) : monthNames[date.getMonth()];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(date);
      return acc;
    },
    {} as Record<string, Date[]>
  );

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border overflow-x-hidden">
      {/* Month/Week row */}
      <div className="flex border-b border-border">
        <div className="w-80 flex-shrink-0 bg-muted/50 border-r border-border px-4 py-2"></div>
        <div className="flex flex-1">
          {Object.entries(groupedDates).map(([label, dates]) => (
            <div
              key={label}
              className="flex-1 px-3 py-2 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-border text-center"
              style={{ minWidth: dates.length * range.pixelsPerDay }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day row */}
      <div className="flex border-b border-border">
        <div className="w-96 flex-shrink-0 bg-background border-r border-border px-4 py-3"></div>
        <div className="flex flex-1">
          {dateLabels.map((date, index) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div
                key={index}
                className={`flex flex-col items-center justify-center text-xs font-medium border-r border-border transition-colors ${isWeekend ? 'bg-muted/50' : 'bg-background'
                  } hover:bg-muted`}
                style={{ width: range.pixelsPerDay }}
              >
                <span className="text-muted-foreground text-xs">{dayAbbreviations[date.getDay()]}</span>
                <span className="font-semibold text-foreground">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;
