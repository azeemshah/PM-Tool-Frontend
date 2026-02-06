import { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/api/use-auth';
import { issueApiService } from '@/api/issue/services/issueApiService';

interface TimerContextType {
  activeTimer: any;
  refetchActiveTimer: () => void;
  isLoading: boolean;
}

export const TimerContext = createContext<TimerContextType>({
  activeTimer: null,
  refetchActiveTimer: () => {},
  isLoading: false,
});

export const useTimer = () => useContext(TimerContext);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: authUser } = useAuth();
  const userId = authUser?._id;
  const queryClient = useQueryClient();

  const { data: activeTimer, refetch, isLoading } = useQuery({
    queryKey: ['active-timer', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const timer = await issueApiService.getActiveTimer(userId);
        console.log('TimerContext: Fetched active timer:', timer);
        return timer;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        console.error("Failed to fetch active timer:", error);
        return null;
      }
    },
    enabled: !!userId,
    // Increase staleTime to prevent immediate refetching which might cause flickering
    // But keep it low enough so it feels responsive
    staleTime: 1000 * 5, // 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Ensure it checks on mount
  });

  const value = useMemo(() => ({
    activeTimer,
    refetchActiveTimer: () => {
      refetch();
      // Invalidate tasks to update time spent columns if needed
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
    },
    isLoading
  }), [activeTimer, refetch, queryClient, isLoading]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
