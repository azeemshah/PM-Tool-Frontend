import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/api/use-auth";
import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";

/**
 * Redirects `/workspace` to `/workspace/:workspaceId`
 * Uses the user's currentWorkspace from auth context
 */
const WorkspaceRedirect = () => {
  const { data: authData, isLoading } = useAuth();

  if (isLoading) return <DashboardSkeleton />;

  const workspaceId = authData?.user?.currentWorkspace?._id || authData?.user?.currentWorkspace;

  if (workspaceId) {
    return <Navigate to={`/workspace/${workspaceId}`} replace />;
  }

  // Fallback if no workspace found
  return <Navigate to="/" replace />;
};

export default WorkspaceRedirect;





