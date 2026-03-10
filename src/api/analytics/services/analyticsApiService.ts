import API from "@/lib/axios-client";
import { AnalyticsResponseType } from "@/types/api.type";

export const analyticsApiService = {
  getAnalytics: async (
    workspaceId: string,
    timeframe?: string
  ): Promise<AnalyticsResponseType> => {
    try {
      const response = await API.get(`/pm-workspace/analytics/${workspaceId}`, {
        params: { timeframe },
      });
      console.log("Workspace analytics response:", response.data);
      return response.data;
    } catch (err: unknown) {
      // If analytics endpoint is missing (404) or backend not ready,
      // return a safe default so dashboard/board components don't crash.
      if (
        (err as Error & { response?: { status: number } })?.response?.status ===
        404
      ) {
        return {
          analytics: {
            totalTasks: 0,
            overdueTasks: 0,
            completedTasks: 0,
          },
        } as unknown as AnalyticsResponseType;
      }
      // rethrow other errors so auth/permission problems surface where appropriate
      throw err;
    }
  },

  getVelocity: async (
    workspaceId: string,
    limit?: number
  ): Promise<{ name: string; committed: number; completed: number }[]> => {
    try {
      const response = await API.get(`/pm-workspace/velocity/${workspaceId}`, {
        params: { limit },
      });
      console.log("Workspace velocity response:", response.data);
      return response.data;
    } catch (err: unknown) {
      console.error("Error fetching workspace velocity:", err);
      throw err;
    }
  },

  getCFD: async (
    workspaceId: string,
    timeframe: string
  ): Promise<{ date: string; [status: string]: string | number }[]> => {
    try {
      const response = await API.get(
        `/pm-workspace/cfd/${workspaceId}?timeframe=${timeframe}`
      );
      return response.data;
    } catch (err: unknown) {
      console.error("Error fetching workspace CFD:", err);
      throw err;
    }
  },
};
