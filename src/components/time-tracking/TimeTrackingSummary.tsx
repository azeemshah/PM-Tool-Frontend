import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap } from 'lucide-react';
import { Issue } from '@/api/issue/types';
import { formatDuration } from '@/lib/helper';

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
  // Use issue properties if provided, otherwise use individual props
  const original = Math.max(0, Number(issue?.originalEstimate || originalEstimate || 0));
  const remaining = Math.max(0, Number(issue?.remainingEstimate || remainingEstimate || 0));
  const spent = Math.max(0, Number(issue?.timeSpent || timeSpent || 0));
  const points = issue?.storyPoints ?? storyPoints;

  // Calculate progress percentage
  const progressPercent = original > 0 ? ((spent / original) * 100) : 0;

  if (original === 0 && spent === 0) {
    return null; // Don't render if no estimates
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
      {/* Time summary line: "5h logged / 2h remaining" */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{formatDuration(spent)}</span>
            {' '}logged
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
            {spent > original && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                +{formatDuration(spent - original)} over
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
