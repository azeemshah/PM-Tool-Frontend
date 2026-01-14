import { useQuery } from "@tanstack/react-query";
import { getWorkflowsQueryFn } from "@/lib/api";

export default function useGetWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: getWorkflowsQueryFn,
    staleTime: 1000 * 60 * 2,
  });
}





