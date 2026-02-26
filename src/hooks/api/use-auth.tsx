import { authApiService } from "@/api/auth/services";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  // Only fetch user if we have an access token
  const hasToken = !!localStorage.getItem("accessToken");
  
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: authApiService.getCurrentUser,
    staleTime: 0,
    retry: 2,
    enabled: hasToken, // Only run query if token exists
  });
  
  // If query is disabled (no token), return with default values
  // This prevents the component from getting stuck in a loading state
  if (!hasToken) {
    return {
      ...query,
      data: undefined,
      isLoading: false,
      isPending: false,
    };
  }
  
  return query;
};

export default useAuth;





