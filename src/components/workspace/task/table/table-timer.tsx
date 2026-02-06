import React, { useState, useEffect, useContext } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const { activeTimer, refetchActiveTimer } = useContext(TimerContext);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Optimistic state to show active immediately after click
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  // Clear optimistic state when server state catches up
  useEffect(() => {
    if (optimisticActive !== null) {
      const propActiveId = activeTimer?.workItemId?._id || activeTimer?.workItemId;
      const propIsMatching = String(propActiveId) === String(issueId);

      if (optimisticActive === propIsMatching) {
        setOptimisticActive(null);
      }
    }
  }, [activeTimer, issueId, optimisticActive]);

  const isActive = React.useMemo(() => {
    // If we have an optimistic state, use it (unless activeTimer prop has caught up)
    if (optimisticActive !== null) {
        const propActiveId = activeTimer?.workItemId?._id || activeTimer?.workItemId;
        const propIsMatching = String(propActiveId) === String(issueId);
        
        // If state hasn't caught up yet, return optimistic value
        if (optimisticActive !== propIsMatching) {
             return optimisticActive;
        }
        // If it has caught up, fall through to standard check (useEffect will clear optimisticActive)
    }

    if (!activeTimer || !activeTimer.workItemId) return false;
    
    const activeId = typeof activeTimer.workItemId === 'object' 
      ? activeTimer.workItemId._id 
      : activeTimer.workItemId;
      
    console.log('TableTimer: Checking match', { 
      activeId, 
      issueId, 
      match: String(activeId) === String(issueId),
      activeTimer 
    });
    return String(activeId) === String(issueId);
  }, [activeTimer, issueId, optimisticActive]);

  useEffect(() => {
    // console.log('TableTimer effect', { issueId, isActive, activeTimer });
    if (isActive) {
      const startTime = activeTimer?.startedAt ? new Date(activeTimer.startedAt).getTime() : Date.now();
      const updateTimer = () => {
        const now = Date.now();
        const seconds = Math.round((now - startTime) / 1000);
        setElapsedSeconds(seconds);
      };
      
      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [isActive, activeTimer]);

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Starting timer for issue:", issueId);
    try {
      setIsLoading(true);
      setOptimisticActive(true); // Optimistically show stop button
      await issueApiService.startTimer(issueId);
      toast({ description: 'Timer started' });
      refetchActiveTimer();
    } catch (error: any) {
      setOptimisticActive(null); // Revert on error
      console.error("Error starting timer:", error);
      
      const errorMessage = error.response?.data?.message || '';
      
      if (errorMessage.includes('already running')) {
         toast({ description: 'Timer synced' });
         refetchActiveTimer();
      } else {
        toast({
          variant: 'destructive',
          description: errorMessage || 'Failed to start timer',
        });
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
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="icon"
          className="h-6 w-6 rounded-full shadow-sm"
          onClick={handleStop}
          disabled={isLoading}
          title="Stop Timer"
        >
          <Square size={10} className="fill-current" />
        </Button>
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
          <Clock className="h-3 w-3 animate-pulse" />
          <span className="font-mono">{formatDuration(elapsedSeconds / 60)}</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/timer">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
        onClick={handleStart}
        disabled={isLoading}
        title="Start Timer"
      >
        <Play size={14} className="ml-0.5" />
      </Button>
      
      {defaultTimeSpent > 0 ? (
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border-0 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(defaultTimeSpent)}</span>
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground ml-1">-</span>
      )}
    </div>
  );
};

