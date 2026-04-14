import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import { TimerProvider } from "@/components/workspace/task/timer-context";
import Asidebar from "@/components/asidebar/asidebar";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import { useIssueSubscription } from "@/hooks/useIssueSubscription";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { NotificationProvider } from "@/contexts/notification-context";

const AppLayout = () => {
  const workspaceId = useWorkspaceId();

  // Initialize WebSocket subscription for real-time updates
  useIssueSubscription({
    workspaceId,
    enabled: !!workspaceId,
  });

  return (
    <AuthProvider>
      <NotificationProvider workspaceId={workspaceId}>
        <TimerProvider>
          <SidebarProvider>
          <Asidebar />
          <SidebarInset className="overflow-x-hidden">
            <div className="w-full">
              <>
                <Header />
                <div className="px-3 lg:px-20 py-3">
                  <Outlet />
                </div>
              </>
              <CreateWorkspaceDialog />
            </div>
          </SidebarInset>
          </SidebarProvider>
        </TimerProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppLayout;





