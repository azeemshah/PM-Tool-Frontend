import { useQuery } from "@tanstack/react-query";
import { workflowApiService } from "@/api/workflow/services";

export default function useGetWorkflow(workflowId?: string) {
  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => workflowApiService.getWorkflowById(workflowId as string),
    enabled: !!workflowId,
  });
}





