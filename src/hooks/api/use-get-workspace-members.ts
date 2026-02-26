import { workspaceApiService } from "@/api/workspace/services";
import { useQuery } from "@tanstack/react-query";

const useGetWorkspaceMembers = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceApiService.getMembers(workspaceId),
    staleTime: Infinity,
    enabled: !!workspaceId,
  });
  return query;
};

export default useGetWorkspaceMembers;





