import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from '@/lib/helper';

export interface TimesheetEntry {
  _id: string;
  timeSpent: number;
  comment?: string;
  workItem: { _id: string; title: string; key: string };
  logDate: string;
}

export interface TimesheetDay {
  totalMinutes: number;
  entries: TimesheetEntry[];
}

export interface TimesheetData {
  userId: string;
  fromDate: string;
  toDate: string;
  dailyBreakdown: { [key: string]: TimesheetDay };
  weeklyTotals: { [key: string]: number };
  totalMinutes: number;
}

export interface TimesheetProps {
  userId: string;
  initialFromDate?: string;
  initialToDate?: string;
}

/**
 * Timesheet Component
 * Displays daily and weekly time tracking summaries
 */
export const Timesheet: React.FC<TimesheetProps> = ({
  userId,
  initialFromDate,
  initialToDate,
}) => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  const [fromDate, setFromDate] = useState(initialFromDate || lastMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(initialToDate || today.toISOString().split('T')[0]);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [data, setData] = useState<TimesheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadTimesheet = async () => {
    try {
      setIsLoading(true);
      const result = await issueApiService.getTimesheet(userId, fromDate, toDate);
      setData(result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to load timesheet',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheet();
  }, [userId, fromDate, toDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Loading timesheet...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">No timesheet data</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          <h2 className="text-lg font-bold">Timesheet</h2>
        </div>

        {/* Date Range & View Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">View</label>
            <div className="flex gap-1">
              <Button
                variant={view === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('daily')}
                className="h-8 text-xs flex-1"
              >
                Daily
              </Button>
              <Button
                variant={view === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('weekly')}
                className="h-8 text-xs flex-1"
              >
                Weekly
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 font-semibold">Total Time Logged</div>
            <div className="text-2xl font-bold text-blue-900">{formatDuration(data.totalMinutes)}</div>
          </div>
          <TrendingUp className="text-blue-600" size={32} />
        </div>
      </div>

      {/* Daily View */}
      {view === 'daily' && (
        <div className="space-y-2">
          {Object.entries(data.dailyBreakdown)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([date, day]) => (
              <div key={date} className="border rounded-lg p-3 bg-white hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="font-bold text-blue-600">{formatDuration(day.totalMinutes)}</div>
                </div>
                <div className="space-y-1">
                  {day.entries.map((entry) => (
                    <div key={entry._id} className="text-xs text-gray-600 flex justify-between items-center">
                      <div>
                        <span className="font-medium">{entry.workItem.key}</span>
                        <span className="text-gray-500"> - {entry.workItem.title}</span>
                      </div>
                      <span className="text-gray-700">{formatDuration(entry.timeSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Weekly View */}
      {view === 'weekly' && (
        <div className="space-y-2">
          {Object.entries(data.weeklyTotals)
            .sort(([weekA], [weekB]) => weekB.localeCompare(weekA))
            .map(([week, total]) => {
              const weekStart = new Date(week);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);

              return (
                <div key={week} className="border rounded-lg p-3 bg-white hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                      {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="font-bold text-blue-600">{formatDuration(total)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Empty State */}
      {Object.keys(data.dailyBreakdown).length === 0 && (
        <div className="text-center py-6 text-gray-500">No time logs in this date range</div>
      )}
    </div>
  );
};
