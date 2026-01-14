import { getCurrentUserQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  // Only fetch user if we have an access token
  const hasToken = !!localStorage.getItem("accessToken");
  
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: getCurrentUserQueryFn,
    staleTime: 0,
    retry: 2,
    enabled: hasToken, // Only run query if token exists
  });
  
  return query;
};

export default useAuth;





