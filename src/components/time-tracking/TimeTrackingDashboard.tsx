import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600 dark:text-blue-400" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={18} className="text-blue-600 dark:text-blue-400" />
          Time Tracking Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Total Logged */}
          <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Time Logged</div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatDuration(stats.totalLogged)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.tasksWithTime} tasks</div>
          </div>

          {/* Total Estimated */}
          <div className="border rounded-lg p-3 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Estimated</div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{formatDuration(stats.totalEstimated)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">total assigned</div>
          </div>

          {/* Total Remaining */}
          <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Remaining</div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{formatDuration(stats.totalRemaining)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">to complete</div>
          </div>
        </div>

        {/* Utilization & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Utilization */}
          <div className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Utilization</div>
              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{utilization}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(stats.totalLogged)} of {stats.totalEstimated} minutes used
            </div>
          </div>

          {/* Active Timers & Overdue */}
          <div className="space-y-2">
            {/* Active Timers */}
            {stats.activeTasks > 0 && (
              <div className="border-2 border-orange-300 dark:border-orange-800 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20">
                <div className="text-xs font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-1">
                  <Clock size={14} />
                  {stats.activeTasks} Active Timer{stats.activeTasks !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Overdue Alert */}
            {stats.tasksOverdue > 0 && (
              <div className="border-2 border-red-300 dark:border-red-800 rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                <div className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {stats.tasksOverdue} Task{stats.tasksOverdue !== 1 ? 's' : ''} Overdue
                </div>
              </div>
            )}

            {/* All On Track */}
            {stats.tasksOverdue === 0 && (
              <div className="border-2 border-green-300 dark:border-green-800 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                <div className="text-xs font-semibold text-green-800 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle size={14} />
                  All Tasks On Track
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t dark:border-slate-700 pt-3 text-xs">
          <button
            onClick={loadTimeStats}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
          >
            ↻ Refresh Stats
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
