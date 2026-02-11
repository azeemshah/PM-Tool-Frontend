import React, { useEffect, useState } from 'react';
import { useTimer } from '../workspace/task/timer-context';
import { Button } from '@/components/ui/button';
import { Square, Clock, Loader2 } from 'lucide-react';
import { formatDuration } from '@/lib/helper';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const GlobalTimer = () => {
  const { activeTimer, refetchActiveTimer, setActiveTimer, isLoading: isGlobalLoading, userId, elapsedSeconds } = useTimer();
  const [isStopping, setIsStopping] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!activeTimer) return null;

  const workItemId = activeTimer.workItemId;
  const taskInfo = (workItemId && typeof workItemId === 'object')
    ? { title: workItemId.title, key: workItemId.key, id: workItemId._id }
    : { title: 'Active Task', key: '', id: String(workItemId) };

  const handleStop = async () => {
    if (!taskInfo.id) return;
    setIsStopping(true);
    try {
      // Optimistically clear timer in context with 'stop' action
      setActiveTimer(null);
      
      await issueApiService.stopTimer(taskInfo.id);
      await refetchActiveTimer();
      queryClient.invalidateQueries({ queryKey: ['issue-logs', taskInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['issue', taskInfo.id] });
      toast({
        title: "Timer Stopped",
        description: `Logged ${formatDuration(elapsedSeconds / 60)} for ${taskInfo.title}`,
        variant: "success",
      });
    } catch (error: any) {
      // Revert optimistic clear if needed by refetching
      await refetchActiveTimer();
      toast({
        title: "Error",
        description: error?.message || "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleNavigate = () => {
    // Navigate to task details or board
    // Assuming we have a route for task details. 
    // If not, maybe just open the board? 
    // For now, let's just show the info. 
    // If the user wants to navigate, we need to know the workspace/project context.
    // Ideally, we can navigate to the workspace board.
    // But keeping it simple for now.
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium font-mono min-w-[60px]">
          {formatDuration(elapsedSeconds / 60)}
        </span>
      </div>
      
      <div className="hidden md:flex flex-col max-w-[200px]">
        <span className="text-xs font-semibold truncate text-orange-900 dark:text-orange-200">
          {taskInfo.title}
        </span>
        {taskInfo.key && (
            <span className="text-[10px] text-orange-600 dark:text-orange-400">
                {taskInfo.key}
            </span>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-orange-700 hover:text-orange-900 hover:bg-orange-200 dark:text-orange-400 dark:hover:bg-orange-900"
        onClick={handleStop}
        disabled={isStopping}
        title="Stop Timer"
      >
        {isStopping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Square className="h-4 w-4 fill-current" />
        )}
      </Button>
    </div>
  );
};
