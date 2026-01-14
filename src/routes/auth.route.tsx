import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthRoute } from "./common/routePaths";

const AuthRoute = () => {
  const location = useLocation();
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  const _isAuthRoute = isAuthRoute(location.pathname);
  const isInviteRoute = location.pathname.includes("/invite/workspace/") && location.pathname.includes("/join");

  if (isLoading && !_isAuthRoute) return <DashboardSkeleton />;

  // For invite routes, allow both logged-in and logged-out users
  if (isInviteRoute) {
    return <Outlet />;
  }

  // If user is logged in, redirect to workspace
  if (user) {
    const workspaceId = user?.currentWorkspace?._id;
    return <Navigate to={workspaceId ? `workspace/${workspaceId}` : `/workspace`} replace />;
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!user && !_isAuthRoute) {
    return <Navigate to="/" replace />;
  }

  // Show login/auth pages
  return <Outlet />;
};

export default AuthRoute;





