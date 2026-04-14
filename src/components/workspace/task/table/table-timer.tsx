import React, { useState, useEffect, useContext } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/helper';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useToast } from '@/hooks/use-toast';
import { TimerContext } from '../timer-context';

interface TableTimerProps {
  issueId: string;
  defaultTimeSpent?: number; // Total time spent so far (minutes)
}

export const TableTimer: React.FC<TableTimerProps> = ({
  issueId,
  defaultTimeSpent = 0,
}) => {
  const { activeTimer, refetchActiveTimer, setActiveTimer, isLoading: isGlobalLoading, lastAction, elapsedSeconds } = useContext(TimerContext);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Combined loading state
  const isAnyLoading = isLoading || isGlobalLoading;

  // Optimistic state to show active immediately after click
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  // Synchronize optimistic state with server state
  useEffect(() => {
    // 0. If lastAction was 'stop' and there is no activeTimer, clear optimisticActive immediately
    // This handles the case where timer is stopped from GlobalTimer
    if (lastAction === 'stop' && activeTimer === null) {
      setOptimisticActive(null);
      return;
    }

    // We only want to clear optimistic state when we have a definite answer from the server
    if (optimisticActive !== null && !isGlobalLoading && !isLoading) {
      const activeWorkItemId = getTimerWorkItemId(activeTimer);
      const normalizedIssueId = String(issueId);

      const isActuallyMatching = (activeWorkItemId && normalizedIssueId)
        ? activeWorkItemId.toLowerCase() === normalizedIssueId.toLowerCase()
        : false;

      // 1. If we have a matching timer from server, we can eventually clear optimistic
      if (isActuallyMatching) {
        const timeout = setTimeout(() => {
          if (isActuallyMatching && optimisticActive !== null) {
            setOptimisticActive(null);
          }
        }, 15000); // Wait 15s to be absolutely sure server is stable
        return () => clearTimeout(timeout);
      }
      // 2. If server has a DIFFERENT timer, clear optimistic immediately to show reality
      else if (activeTimer && !isActuallyMatching) {
        setOptimisticActive(null);
      }
      // 3. If server says NULL, wait longer (15s) before giving up on optimistic start
      else if (activeTimer === null && optimisticActive === true) {
        // If lastAction is 'start', we definitely wait for the server to catch up
        const timeout = setTimeout(() => {
          if (optimisticActive === true && activeTimer === null && !isGlobalLoading && !isLoading) {
            console.log('TableTimer: Grace period expired for start, clearing optimistic state');
            setOptimisticActive(null);
          }
        }, 15000);
        return () => clearTimeout(timeout);
      }
      // 4. If server says something but we wanted to STOP
      else if (activeTimer !== null && optimisticActive === false) {
        const timeout = setTimeout(() => {
          if (optimisticActive === false && activeTimer !== null && !isGlobalLoading && !isLoading) {
            console.log('TableTimer: Grace period expired for stop, clearing optimistic state');
            setOptimisticActive(null);
          }
        }, 15000);
        return () => clearTimeout(timeout);
      }
    }
  }, [activeTimer, issueId, optimisticActive, isGlobalLoading, isLoading, lastAction]);

  // Helper to get workItem ID from a timer object
  const getTimerWorkItemId = (timer: any) => {
    if (!timer) return null;

    // Check various common fields where the ID might be stored
    let id = null;

    if (timer.workItemId) {
      if (typeof timer.workItemId === 'object') {
        id = timer.workItemId._id || timer.workItemId.id || (timer.workItemId.toString !== Object.prototype.toString ? timer.workItemId.toString() : null);
      } else {
        id = timer.workItemId;
      }
    }

    if (!id && timer.issueId) {
      id = timer.issueId;
    }

    if (!id && timer.workItem) {
      if (typeof timer.workItem === 'object') {
        id = timer.workItem._id || timer.workItem.id || (timer.workItem.toString !== Object.prototype.toString ? timer.workItem.toString() : null);
      } else {
        id = timer.workItem;
      }
    }

    if (!id && timer._id) {
      // Last resort, but unlikely to be the workItemId
      // Only use if we're sure it's not the timer's own ID
    }

    return id ? String(id) : null;
  };

  const isActive = React.useMemo(() => {
    const activeWorkItemId = getTimerWorkItemId(activeTimer);
    const normalizedIssueId = String(issueId);

    const isActuallyMatching = (activeWorkItemId && normalizedIssueId)
      ? activeWorkItemId.toLowerCase() === normalizedIssueId.toLowerCase()
      : false;

    // If we have an optimistic state, it takes absolute precedence
    if (optimisticActive !== null) {
      return optimisticActive;
    }

    return isActuallyMatching;
  }, [activeTimer, issueId, optimisticActive]);

  // Is ANY timer active? (to disable other play buttons)
  const isAnyTimerActive = !!activeTimer || optimisticActive === true;

  // We only show the "Another timer is running" state if we are NOT loading
  // to prevent flickering with stale cached data
  const showActiveConflict = isAnyTimerActive && !isActive && !isGlobalLoading;

  if (isGlobalLoading && !isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>
    );
  }

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const activeWorkItemId = getTimerWorkItemId(activeTimer);
    if (activeWorkItemId) {
      if (String(activeWorkItemId).toLowerCase() !== String(issueId).toLowerCase()) {
        toast({
          variant: 'destructive',
          description: 'A timer is already running for another task. Please stop it first.',
        });
        return;
      }
    }

    try {
      setIsLoading(true);
      const now = Date.now();
      setOptimisticActive(true);

      const result = await issueApiService.startTimer(issueId);

      const timerData = result.timer || result;
      // Update global context immediately with our local start time to ensure 0-based start
      setActiveTimer(timerData, now);

      toast({ description: 'Timer started' });

      // Delay refetch longer to allow DB to propagate
      setTimeout(() => {
        refetchActiveTimer();
      }, 10000);
    } catch (error: any) {
      console.error("Error starting timer:", error);

      const errorMessage = error.response?.data?.message || '';

      // If it's already running for THIS issue, just sync
      if (errorMessage.includes('already running for this issue') ||
        (errorMessage.includes('already running') && !errorMessage.includes('"'))) {
        toast({ description: 'Timer synced' });
        setOptimisticActive(true);
        refetchActiveTimer();
      } else {
        // If it's running for ANOTHER issue, show the full error so the user knows which one
        setOptimisticActive(null);
        toast({
          variant: 'destructive',
          description: errorMessage || 'Failed to start timer',
        });
        refetchActiveTimer(); // Sync to show which one is active
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Stopping timer for issue:", issueId);
    try {
      setIsLoading(true);
      // We stop the timer without a comment for the table view quick action
      const result = await issueApiService.stopTimer(issueId);

      setOptimisticActive(false); // Optimistically show start button
      setActiveTimer(null); // Clear global context immediately

      toast({ description: `Timer logged: ${formatDuration(result.elapsedMinutes)}` });
      refetchActiveTimer();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to stop timer';

      // If the error is "No active timer found", it means it's already stopped.
      // We can treat this as a success (or at least not an error to the user).
      if (errorMessage === "No active timer found for this issue" || errorMessage.includes("No active timer")) {
        setOptimisticActive(false); // Ensure UI reflects stopped state
        refetchActiveTimer(); // Sync with server
        return;
      }

      setOptimisticActive(null); // Revert on error - force re-evaluation
      console.error("Error stopping timer:", error);
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 px-3 py-1 h-7 rounded-md text-xs font-medium shadow-sm border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
        onClick={handleStop}
        disabled={isAnyLoading}
        title="Stop Timer"
      >
        <Clock className="h-3 w-3 animate-pulse" />
        <span className="font-mono">{formatDuration(elapsedSeconds / 60)}</span>
      </Button>
    );
  }

  const displayDuration = defaultTimeSpent > 0 ? defaultTimeSpent : 0;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-1 px-3 py-1 h-7 rounded-md text-xs font-medium shadow-sm border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
      onClick={handleStart}
      disabled={isAnyLoading || showActiveConflict}
      title={showActiveConflict ? "Another timer is running" : "Start Timer"}
    >
      <Clock className="h-3 w-3" />
      <span className="font-mono">
        {formatDuration(displayDuration)}
      </span>
    </Button>
  );
};

