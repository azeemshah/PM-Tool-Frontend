import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { toast, useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/helper';
import { useTimer } from '../workspace/task/timer-context';

export interface TimerButtonProps {
  issueId: string;
  userId: string;
  onTimerStart?: () => void;
  onTimerStop?: (elapsedMinutes: number) => void;
}

/**
 * Timer Button Component
 * Allows users to start/stop a timer for an issue
 * Shows live elapsed time when active
 */
export const TimerButton: React.FC<TimerButtonProps> = ({
  issueId,
  userId,
  onTimerStart,
  onTimerStop,
}) => {
  const { activeTimer, refetchActiveTimer, setActiveTimer, isLoading: isGlobalLoading, lastAction, elapsedSeconds } = useTimer();
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Optimistic state
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  // Helper to get workItem ID from a timer object
  const getTimerWorkItemId = (timer: any) => {
    if (!timer) return null;
    let id = null;
    if (timer.workItemId) {
      if (typeof timer.workItemId === 'object') {
        id = timer.workItemId._id || timer.workItemId.id || (timer.workItemId.toString !== Object.prototype.toString ? timer.workItemId.toString() : null);
      } else {
        id = timer.workItemId;
      }
    } 
    if (!id && timer.issueId) id = timer.issueId;
    if (!id && timer.workItem) {
      if (typeof timer.workItem === 'object') {
        id = timer.workItem._id || timer.workItem.id || (timer.workItem.toString !== Object.prototype.toString ? timer.workItem.toString() : null);
      } else {
        id = timer.workItem;
      }
    }
    return id ? String(id) : null;
  };

  const isActive = React.useMemo(() => {
    const activeWorkItemId = getTimerWorkItemId(activeTimer);
    const normalizedIssueId = String(issueId);
    
    const isActuallyMatching = (activeWorkItemId && normalizedIssueId) 
      ? activeWorkItemId.toLowerCase() === normalizedIssueId.toLowerCase() 
      : false;

    if (optimisticActive !== null) {
      return optimisticActive;
    }

    return isActuallyMatching;
  }, [activeTimer, issueId, optimisticActive]);

  const activeOtherTask = React.useMemo(() => {
    if (isActive) return null;
    
    const activeWorkItemId = getTimerWorkItemId(activeTimer);
    if (!activeWorkItemId) return null;

    // It's active elsewhere
    if (activeTimer.workItemId && typeof activeTimer.workItemId === 'object') {
      return { title: activeTimer.workItemId.title, key: activeTimer.workItemId.key };
    }
    return { title: 'Another Task', key: 'Active' };
  }, [activeTimer, isActive]);

  // Force refetch on mount to ensure fresh state
  useEffect(() => {
    refetchActiveTimer();
  }, []);

  // Synchronize optimistic state
  useEffect(() => {
    if (optimisticActive !== null && !isGlobalLoading && !isLoading) {
      const activeWorkItemId = getTimerWorkItemId(activeTimer);
      const isActuallyMatching = activeWorkItemId && activeWorkItemId.toLowerCase() === String(issueId).toLowerCase();

      // 0. If lastAction was 'stop' and there is no activeTimer, clear optimisticActive immediately
      if (lastAction === 'stop' && activeTimer === null) {
        setOptimisticActive(null);
        return;
      }

      // 1. If matching timer from server, wait a bit before clearing optimistic to ensure stability
      if (isActuallyMatching) {
        const timeout = setTimeout(() => {
          if (isActuallyMatching && optimisticActive !== null) {
            setOptimisticActive(null);
          }
        }, 15000);
        return () => clearTimeout(timeout);
      } 
      // 2. If server has a DIFFERENT timer, clear optimistic immediately
      else if (activeTimer && !isActuallyMatching) {
        setOptimisticActive(null);
      } 
      // 3. If server says NULL but we wanted to START, wait 15s
      else if (activeTimer === null && optimisticActive === true) {
        const timeout = setTimeout(() => {
          if (optimisticActive === true && activeTimer === null && !isGlobalLoading && !isLoading) {
            console.log('TimerButton: Grace period expired for start, clearing optimistic state');
            setOptimisticActive(null);
          }
        }, 15000);
        return () => clearTimeout(timeout);
      }
      // 4. If server has a timer but we wanted to STOP, wait 15s
      else if (activeTimer !== null && optimisticActive === false) {
        const timeout = setTimeout(() => {
          if (optimisticActive === false && activeTimer !== null && !isGlobalLoading && !isLoading) {
            console.log('TimerButton: Grace period expired for stop, clearing optimistic state');
            setOptimisticActive(null);
          }
        }, 15000);
        return () => clearTimeout(timeout);
      }
    }
  }, [activeTimer, issueId, optimisticActive, isGlobalLoading, isLoading, lastAction]);

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentActiveId = activeTimer ? (activeTimer.workItemId?._id || activeTimer.workItemId || activeTimer.issueId || activeTimer.workItem?._id || activeTimer.workItem) : null;
    
    if (currentActiveId) {
      if (String(currentActiveId).toLowerCase() !== String(issueId).toLowerCase()) {
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
      // Update global context immediately with our local start time
      setActiveTimer(timerData, now);
      
      toast({ description: 'Timer started' });
      onTimerStart?.();
      
      // Delay refetch slightly longer
      setTimeout(() => {
        refetchActiveTimer();
      }, 10000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '';
      // If error is "Timer already running for this issue", we should just sync state
      if (errorMessage.includes('already running for this issue') || 
          (errorMessage.includes('already running') && !errorMessage.includes('"'))) {
        await refetchActiveTimer();
        return;
      }
      
      toast({
        variant: 'destructive',
        description: errorMessage || 'Failed to start timer',
      });
      refetchActiveTimer();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setIsLoading(true);
      const result = await issueApiService.stopTimer(issueId, comment);
      
      // Update global context immediately
      setActiveTimer(null);
      
      setComment('');
      setShowCommentInput(false);
      toast({ description: `Timer logged: ${formatDuration(result.elapsedMinutes)}` });
      onTimerStop?.(result.elapsedMinutes);
      refetchActiveTimer(); // Sync in background
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to stop timer',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    return formatDuration(seconds / 60);
  };

  if (isActive) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleStop}
            disabled={isLoading}
            className="h-6 w-6 rounded-full shadow-sm"
            title="Stop Timer"
          >
            <Square size={10} className="fill-current" />
          </Button>
          <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
            <Clock className="h-3 w-3 animate-pulse" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {showCommentInput && (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCommentInput(false)}
              className="h-8 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300"
            >
              Done
            </Button>
          </div>
        )}

        {!showCommentInput && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentInput(true)}
            className="h-7 text-xs w-full dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Add comment...
          </Button>
        )}
      </div>
    );
  }

  if (isGlobalLoading) {
    return (
      <Button variant="outline" className="w-full justify-start gap-2" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading Timer...
      </Button>
    );
  }

  if (activeOtherTask) {
    return (
      <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
        <div className="flex items-center gap-2 text-orange-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Timer running on another task</span>
        </div>
        <div className="mt-1 text-xs text-orange-600 pl-6">
          {activeOtherTask.key}: {activeOtherTask.title}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStart}
        disabled={isLoading || (!!activeTimer && !isActive)}
        className="gap-2 w-full"
      >
        <Play size={16} />
        Start Timer
      </Button>
    </div>
  );
};
