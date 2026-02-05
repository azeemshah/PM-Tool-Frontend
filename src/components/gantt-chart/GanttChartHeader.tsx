import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { GanttFilters, TimelineRange } from './types/gantt';

interface GanttChartHeaderProps {
  viewType: 'week' | 'month';
  onViewTypeChange: (type: 'week' | 'month') => void;
  range: TimelineRange;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  filters: GanttFilters;
  onStatusFilterChange: (statuses: string[]) => void;
  onAssigneeFilterChange: (assignees: string[]) => void;
  onTypeFilterChange: (types: string[]) => void;
  onSearchChange: (text: string) => void;
  isLoading?: boolean;
  statuses?: string[];
  assignees?: Array<{ id: string; name: string }>;
  types?: string[];
}

export const GanttChartHeader: React.FC<GanttChartHeaderProps> = ({
  viewType,
  onViewTypeChange,
  range,
  onPreviousPeriod,
  onNextPeriod,
  filters,
  onSearchChange,
  isLoading = false,
}) => {
  const formatDateRange = () => {
    const start = range.start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-3">
      {/* Top row: Title and loading indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Gantt Chart</h1>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Controls row: View, navigation, search */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewTypeChange('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewType === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onViewTypeChange('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewType === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2">
          <button
            onClick={onPreviousPeriod}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900 transition-colors"
            title="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-fit px-2 whitespace-nowrap">
            {formatDateRange()}
          </span>
          <button
            onClick={onNextPeriod}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900 transition-colors"
            title="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-fit max-w-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="flex-1 outline-none text-sm bg-transparent text-gray-900 placeholder-gray-400"
            value={filters.searchText || ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter button */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
};

export default GanttChartHeader;
