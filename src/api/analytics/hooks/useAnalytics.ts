import { useQuery } from '@tanstack/react-query';
import { analyticsApiService } from '../services';

export const useGetAnalytics = (workspaceId: string, timeframe?: string, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', workspaceId, timeframe],
    queryFn: () => analyticsApiService.getAnalytics(workspaceId, timeframe),
    enabled: enabled && !!workspaceId,
  });
};

export const useGetVelocity = (workspaceId: string, limit?: number, enabled = true) => {
  return useQuery({
    queryKey: ['velocity', workspaceId, limit],
    queryFn: () => analyticsApiService.getVelocity(workspaceId, limit),
    enabled: enabled && !!workspaceId,
  });
};

export const useGetCFD = (workspaceId: string, timeframe: string, enabled = true) => {
  return useQuery({
    queryKey: ['cfd', workspaceId, timeframe],
    queryFn: () => analyticsApiService.getCFD(workspaceId, timeframe),
    enabled: enabled && !!workspaceId && !!timeframe,
  });
};
