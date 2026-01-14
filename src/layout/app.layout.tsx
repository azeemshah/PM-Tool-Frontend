import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import Asidebar from "@/components/asidebar/asidebar";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import { useIssueSubscription } from "@/hooks/useIssueSubscription";
import useWorkspaceId from "@/hooks/use-workspace-id";

const AppLayout = () => {
  const workspaceId = useWorkspaceId();

  // Initialize WebSocket subscription for real-time updates
  useIssueSubscription({
    workspaceId,
    enabled: !!workspaceId,
  });

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
};

export default AppLayout;
