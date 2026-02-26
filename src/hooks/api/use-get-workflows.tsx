import { useQuery } from "@tanstack/react-query";
import { workflowApiService } from "@/api/workflow/services";

export default function useGetWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: workflowApiService.getWorkflows,
    staleTime: 1000 * 60 * 2,
  });
}





