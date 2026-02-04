import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/helper';

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
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load active timer on mount
  useEffect(() => {
    loadActiveTimer();
  }, []);

  // Live timer tick
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const loadActiveTimer = async () => {
    try {
      const timer = await issueApiService.getActiveTimer(userId);
      if (timer && timer._id) {
        setIsActive(true);
        const elapsed = timer.startedAt
          ? Math.round((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
          : 0;
        setElapsedSeconds(elapsed);
      }
    } catch (_e) {
      // No active timer
    }
  };

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await issueApiService.startTimer(issueId);
      setIsActive(true);
      setElapsedSeconds(0);
      setShowCommentInput(false);
      toast({ description: 'Timer started' });
      onTimerStart?.();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to start timer',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsLoading(true);
      const result = await issueApiService.stopTimer(issueId, comment);
      setIsActive(false);
      setElapsedSeconds(0);
      setComment('');
      setShowCommentInput(false);
      toast({ description: `Timer logged: ${formatDuration(result.elapsedMinutes)}` });
      onTimerStop?.(result.elapsedMinutes);
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
        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-lg">
          <Clock className="text-orange-600 dark:text-orange-400 flex-shrink-0" size={18} />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex-1">{formatTime(elapsedSeconds)}</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={isLoading}
            className="h-8 gap-1"
          >
            <Square size={14} />
            Stop
          </Button>
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStart}
      disabled={isLoading}
      className="gap-2 w-full"
    >
      <Play size={16} />
      Start Timer
    </Button>
  );
};
