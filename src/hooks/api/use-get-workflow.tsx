import { useQuery } from "@tanstack/react-query";
import { getWorkflowByIdQueryFn } from "@/lib/api";

export default function useGetWorkflow(workflowId?: string) {
  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => getWorkflowByIdQueryFn(workflowId as string),
    enabled: !!workflowId,
  });
}





