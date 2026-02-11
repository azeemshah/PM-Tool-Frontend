import { createContext, useContext, useMemo, useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/api/use-auth';
import { issueApiService } from '@/api/issue/services/issueApiService';

interface TimerContextType {
  activeTimer: any;
  refetchActiveTimer: () => Promise<any>;
  setActiveTimer: (timer: any, startTime?: number) => void;
  isLoading: boolean;
  userId?: string;
  effectiveStartTime: number | null;
  elapsedSeconds: number;
  lastAction: 'start' | 'stop' | null;
}

export const TimerContext = createContext<TimerContextType>({
  activeTimer: null,
  refetchActiveTimer: async () => {},
  setActiveTimer: () => {},
  isLoading: false,
  effectiveStartTime: null,
  elapsedSeconds: 0,
  lastAction: null,
});

export const useTimer = () => useContext(TimerContext);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: authUser, isLoading: isAuthLoading } = useAuth();
  const userId = authUser?._id;
  const queryClient = useQueryClient();

  // Load from generic key for immediate access on refresh
  const getInitialTimer = () => {
    try {
      const cached = localStorage.getItem('active_timer_last');
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log('TimerContext: Loaded initial timer from localStorage:', parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('TimerContext: Error loading initial timer:', e);
      return null;
    }
  };

  const [localActiveTimer, setLocalActiveTimer] = useState(getInitialTimer());
  const [effectiveStartTime, setEffectiveStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastAction, setLastAction] = useState<'start' | 'stop' | null>(null);
  const [recentlyStoppedId, setRecentlyStoppedId] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);
  const stopTimestampRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);

  // Initialize effectiveStartTime from initial timer
  useEffect(() => {
    const initial = getInitialTimer();
    if (initial && !effectiveStartTime) {
      const startTimeStr = initial.startedAt || initial.logDate || initial.createdAt;
      if (startTimeStr) {
        const startTime = new Date(startTimeStr).getTime();
        console.log('TimerContext: Initializing effectiveStartTime from initial timer:', startTime);
        setEffectiveStartTime(startTime);
      }
    }
  }, []);

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
    
    return id ? String(id) : null;
  };

  const { data: serverTimer, refetch, isLoading: isTimerLoading, isFetching } = useQuery({
    queryKey: ['active-timer', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        console.log('TimerContext: Fetching active timer for user:', userId);
        const timer = await issueApiService.getActiveTimer(userId);
        console.log('TimerContext: Server returned active timer:', timer);
        return timer;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        console.error("Failed to fetch active timer:", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 10, // Even shorter stale time
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Effect to sync server data to local state
  useEffect(() => {
    const now = Date.now();
    const isStopGracePeriod = now - stopTimestampRef.current < 15000;

    if (serverTimer) {
      console.log('TimerContext: Server timer received:', serverTimer);
      const serverTimerId = getTimerWorkItemId(serverTimer);
      
      // If we recently stopped THIS timer, and server still returns it, ignore it
      if (isStopGracePeriod && serverTimerId === recentlyStoppedId) {
        console.log('TimerContext: Ignoring stale server timer during grace period:', serverTimerId);
        return;
      }

      console.log('TimerContext: Updating localActiveTimer with serverTimer');
      setLocalActiveTimer(serverTimer);
      stopRequestedRef.current = false;
      if (!isStopGracePeriod) setRecentlyStoppedId(null);
      
      // Update effectiveStartTime if it's not set or if it's significantly different (drift)
      const serverStartTimeStr = serverTimer.startedAt || serverTimer.logDate || serverTimer.createdAt;
      if (serverStartTimeStr) {
        const serverStartTime = new Date(serverStartTimeStr).getTime();
        setEffectiveStartTime(prev => {
          const now = Date.now();
          const isStartGracePeriod = now - startTimestampRef.current < 30000;

          if (!prev) {
            console.log('TimerContext: Setting initial effectiveStartTime from server:', serverStartTime);
            return serverStartTime;
          }

          // If we just started a timer, trust our local start time even if server differs
          // this ensures the timer starts from 0 as requested by user
          if (isStartGracePeriod && lastAction === 'start') {
            console.log('TimerContext: Prioritizing local start time over server during grace period');
            return prev;
          }

          // If drift is more than 30s, sync with server
          if (Math.abs(prev - serverStartTime) > 30000) {
            console.log('TimerContext: Correcting drift for effectiveStartTime:', serverStartTime);
            return serverStartTime;
          }
          return prev;
        });
      }
    } else if (serverTimer === null && !isTimerLoading && !isFetching) {
      const isStartGracePeriod = now - startTimestampRef.current < 30000;
      if (isStartGracePeriod && lastAction === 'start') {
        console.log('TimerContext: Keeping local timer during start grace period');
        return;
      }

      console.log('TimerContext: Server timer is null, clearing local state');
      // Server says it's definitely gone
      setLocalActiveTimer(null);
      setEffectiveStartTime(null);
      stopRequestedRef.current = false;
      setRecentlyStoppedId(null);
      startTimestampRef.current = 0;
    }
  }, [serverTimer, isTimerLoading, isFetching, recentlyStoppedId, lastAction]);

  // The active timer is either what's on the server, or what we have locally (optimistic/cached)
  const activeTimer = useMemo(() => {
    const now = Date.now();
    const isStopGracePeriod = now - stopTimestampRef.current < 15000;
    
    // If we just stopped something, don't show it even if server/local state still has it
    if (isStopGracePeriod && recentlyStoppedId) {
      const currentServerId = getTimerWorkItemId(serverTimer);
      const currentLocalId = getTimerWorkItemId(localActiveTimer);
      
      if (currentServerId === recentlyStoppedId || currentLocalId === recentlyStoppedId) {
        console.log('TimerContext: Hiding active timer during stop grace period');
        return null;
      }
    }

    if (stopRequestedRef.current) {
      console.log('TimerContext: Hiding active timer because stop was requested');
      return null;
    }
    
    const effectiveTimer = serverTimer || localActiveTimer;
    if (effectiveTimer) {
      console.log('TimerContext: Active timer determined:', effectiveTimer);
    }
    return effectiveTimer;
  }, [serverTimer, localActiveTimer, recentlyStoppedId, lastAction]);

  // Sync active timer to local storage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('active_timer_last', JSON.stringify(activeTimer));
      if (userId) {
        localStorage.setItem(`active_timer_${userId}`, JSON.stringify(activeTimer));
      }
    } else if (activeTimer === null && !isTimerLoading && !isFetching) {
      localStorage.removeItem('active_timer_last');
      if (userId) {
        localStorage.removeItem(`active_timer_${userId}`);
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active_timer_last' || (userId && e.key === `active_timer_${userId}`)) {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTimer, userId, isTimerLoading, isFetching, refetch]);

  // Timer tick effect
  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      let startTime: number;

      if (effectiveStartTime) {
        startTime = effectiveStartTime;
      } else {
        const startTimeStr = activeTimer.startedAt || activeTimer.logDate || activeTimer.createdAt;
        startTime = startTimeStr ? new Date(startTimeStr).getTime() : Date.now();
      }

      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, effectiveStartTime]);

  const value = useMemo(() => ({
    activeTimer,
    effectiveStartTime,
    elapsedSeconds,
    lastAction,
    refetchActiveTimer: async () => {
      const result = await refetch();
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
      return result;
    },
    setActiveTimer: (timer: any, startTime?: number) => {
      console.log('TimerContext: Manually setting active timer:', timer, 'with startTime:', startTime);
      if (timer === null) {
        // Track exactly what we are stopping to prevent it coming back from server cache
        const idToStop = getTimerWorkItemId(activeTimer);
        if (idToStop) {
          setRecentlyStoppedId(idToStop);
          stopTimestampRef.current = Date.now();
        }
        
        stopRequestedRef.current = true;
        setLocalActiveTimer(null);
        setEffectiveStartTime(null);
        setLastAction('stop');
      } else {
        stopRequestedRef.current = false;
        setRecentlyStoppedId(null);
        stopTimestampRef.current = 0;
        startTimestampRef.current = Date.now();
        setLocalActiveTimer(timer);
        setLastAction('start');
        if (startTime) {
          setEffectiveStartTime(startTime);
        } else {
          const startTimeStr = timer.startedAt || timer.logDate || timer.createdAt;
          if (startTimeStr) {
            setEffectiveStartTime(new Date(startTimeStr).getTime());
          }
        }
      }
      queryClient.setQueryData(['active-timer', userId], timer);
      
      if (timer) {
        localStorage.setItem('active_timer_last', JSON.stringify(timer));
        if (userId) {
          localStorage.setItem(`active_timer_${userId}`, JSON.stringify(timer));
        }
      } else {
        localStorage.removeItem('active_timer_last');
        if (userId) {
          localStorage.removeItem(`active_timer_${userId}`);
        }
      }
    },
    isLoading: isAuthLoading || isTimerLoading || isFetching,
    userId
  }), [activeTimer, effectiveStartTime, elapsedSeconds, lastAction, recentlyStoppedId, refetch, queryClient, isAuthLoading, isTimerLoading, isFetching, userId]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
