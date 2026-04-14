import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { formatDuration } from '@/lib/helper';

export interface TimeTrackingDashboardProps {
  workspaceId: string;
}

interface TimeStats {
  totalLogged: number; // minutes
  totalEstimated: number; // minutes
  totalRemaining: number; // minutes
  tasksWithTime: number;
  tasksOverdue: number;
  activeTasks: number;
}

/**
 * Time Tracking Dashboard Widget
 * Shows:
 * - Total time logged across workspace
 * - Total time estimated
 * - Total time remaining
 * - Tasks with active timers
 */
export const TimeTrackingDashboard: React.FC<TimeTrackingDashboardProps> = ({ workspaceId }) => {
  const [stats, setStats] = useState<TimeStats>({
    totalLogged: 0,
    totalEstimated: 0,
    totalRemaining: 0,
    tasksWithTime: 0,
    tasksOverdue: 0,
    activeTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeStats();
  }, [workspaceId]);

  const loadTimeStats = async () => {
    try {
      setLoading(true);
      // Fetch all tasks in workspace
      const tasksResponse = await issueApiService.getTasksByWorkspace(workspaceId, {
        limit: 1000,
      });

      const tasks = tasksResponse.data || [];

      // Calculate stats
      let totalLogged = 0;
      let totalEstimated = 0;
      let totalRemaining = 0;
      let tasksWithTime = 0;
      let tasksOverdue = 0;
      let activeTasks = 0;

      tasks.forEach((task: any) => {
        const timeSpent = task.timeSpent || 0;
        const originalEstimate = task.originalEstimate || 0;
        const remainingEstimate = task.remainingEstimate || 0;

        if (timeSpent > 0) {
          totalLogged += timeSpent;
          tasksWithTime++;
        }

        if (originalEstimate > 0) {
          totalEstimated += originalEstimate;
        }

        if (remainingEstimate > 0) {
          totalRemaining += remainingEstimate;
        }

        // Check if overdue (no longer has remaining time but task not done)
        if (remainingEstimate <= 0 && task.status && !['done', 'closed'].includes(task.status?.toLowerCase())) {
          tasksOverdue++;
        }

        // Check if task has active timer
        if (task.isTimerActive) {
          activeTasks++;
        }
      });

      setStats({
        totalLogged,
        totalEstimated,
        totalRemaining,
        tasksWithTime,
        tasksOverdue,
        activeTasks,
      });
    } catch (error) {
      console.error('Failed to load time stats', error);
    } finally {
      setLoading(false);
    }
  };

  const utilization = stats.totalEstimated > 0
    ? Math.round((stats.totalLogged / stats.totalEstimated) * 100)
    : 0;

  if (loading) {
    return (
      <Card className="border rounded-lg bg-card p-2">
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Time Tracking Overview</span>
          <button
            type="button"
            onClick={loadTimeStats}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card"
            aria-label="Refresh time tracking stats"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex h-[140px] items-center justify-center px-3 py-6 text-sm text-muted-foreground">
          Loading time tracking stats...
        </div>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg bg-card p-2">
      <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <span className="text-sm font-semibold text-foreground">Time Tracking Overview</span>
        <button
          type="button"
          onClick={loadTimeStats}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card"
          aria-label="Refresh time tracking stats"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <CardContent className="space-y-4 pt-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-none">
            <div className="text-xs font-medium text-muted-foreground">Time Logged</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {formatDuration(stats.totalLogged)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.tasksWithTime} tasks
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-none">
            <div className="text-xs font-medium text-muted-foreground">Estimated</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {formatDuration(stats.totalEstimated)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">total assigned</div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-none">
            <div className="text-xs font-medium text-muted-foreground">Remaining</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {formatDuration(stats.totalRemaining)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">to complete</div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border bg-card px-4 py-3 shadow-none">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Utilization</div>
              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{utilization}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {Math.round(stats.totalLogged)} of {stats.totalEstimated} minutes used
              </span>
              {stats.activeTasks > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock size={12} />
                  {stats.activeTasks} active
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
