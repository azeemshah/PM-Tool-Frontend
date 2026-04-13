import { keepPreviousData, useQuery } from "@tanstack/react-query";
import API from "@/lib/axios-client";

export type ActivityType =
  | "create"
  | "edit"
  | "move"
  | "status_change"
  | "time_logged"
  | "comment"
  | "delete";

export interface HistoryParams {
  userId?: string;
  projectId?: string;
  taskId?: string;
  type?: ActivityType | "all";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

export interface Activity {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  taskId?: {
    _id: string;
    title: string;
    type: string;
    status: string;
  };
  projectId?: {
    _id: string;
    name: string;
  };
  type: ActivityType;
  details?: any;
  from?: string;
  to?: string;
  timeSpentSeconds?: number;
  createdAt: string;
}

export interface HistoryResponse {
  items: Activity[];
  total: number;
  page: number;
  limit: number;
}

export function useGetHistory(params: HistoryParams) {
  return useQuery({
    queryKey: ["history", params],
    queryFn: async () => {
      const { data } = await API.get("/pm-history", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
