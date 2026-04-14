import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap } from 'lucide-react';
import { Issue } from '@/api/issue/types';
import { formatDuration } from '@/lib/helper';
import { useTimer } from '@/components/workspace/task/timer-context';

interface TimeTrackingSummaryProps {
  issue?: Issue;
  originalEstimate?: number; // minutes
  remainingEstimate?: number; // minutes
  timeSpent?: number; // minutes
  storyPoints?: number | null;
}

export function TimeTrackingSummary({
  issue,
  originalEstimate,
  remainingEstimate,
  timeSpent,
  storyPoints,
}: TimeTrackingSummaryProps) {
  const { activeTimer, refetchActiveTimer, isLoading: isGlobalLoading, elapsedSeconds: globalElapsedSeconds } = useTimer();

  // Use issue properties if provided, otherwise use individual props
  const original = Math.max(0, Number(issue?.originalEstimate || originalEstimate || 0));
  const remaining = Math.max(0, Number(issue?.remainingEstimate || remainingEstimate || 0));
  const baseSpent = Math.max(0, Number(issue?.timeSpent || timeSpent || 0));
  const points = issue?.storyPoints ?? storyPoints;

  // Force refetch on mount to ensure fresh state
  useEffect(() => {
    refetchActiveTimer();
  }, []);

  // Track active timer for this issue
  const elapsedSeconds = React.useMemo(() => {
    // Don't reset state while loading to prevent flicker
    if (isGlobalLoading) return 0;
    if (activeTimer === undefined) return 0;

    if (activeTimer && issue && activeTimer.workItemId) {
      const timerIssueId = (typeof activeTimer.workItemId === 'object' && activeTimer.workItemId !== null)
        ? activeTimer.workItemId._id 
        : activeTimer.workItemId;
      
      // Use string comparison to avoid type mismatches
      if (String(timerIssueId) === String(issue._id)) {
        return globalElapsedSeconds;
      }
    }
    return 0;
  }, [activeTimer, issue?._id, isGlobalLoading, globalElapsedSeconds]);

  // Calculate total spent including current session
  const totalSpent = baseSpent + (elapsedSeconds / 60);

  // Calculate progress percentage
  const progressPercent = original > 0 ? ((totalSpent / original) * 100) : 0;

  if (original === 0 && totalSpent === 0) {
    return null; // Don't render if no estimates
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
      {/* Time summary line: "5h logged / 2h remaining" */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatDuration(totalSpent)}
            </span>
            {' '}logged
            {elapsedSeconds > 0 && (
              <span className="text-xs text-orange-600 dark:text-orange-400 ml-1 font-normal animate-pulse">
                (running)
              </span>
            )}
            {original > 0 && (
              <>
                {' / '}
                <span className="font-semibold text-gray-900 dark:text-white">{formatDuration(remaining)}</span>
                {' '}remaining
              </>
            )}
          </div>
        </div>
        {points && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Zap className="h-3 w-3" />
            {points} pts
          </div>
        )}
      </div>

      {/* Progress bar */}
      {original > 0 && (
        <>
          <Progress value={Math.min(progressPercent, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {original > 0
                ? `${Math.round(progressPercent)}% of ${formatDuration(original)}`
                : 'No estimate'}
            </span>
            {totalSpent > original && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                +{formatDuration(totalSpent - original)} over
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
