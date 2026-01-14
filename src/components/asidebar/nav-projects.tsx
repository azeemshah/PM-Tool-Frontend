import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { Permissions } from "@/constant";
import PermissionsGuard from "../resuable/permission-guard";

export function NavProjects() {
  const workspaceId = useWorkspaceId();

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="w-full justify-between pr-0">
          <span>Issues</span>

          <PermissionsGuard requiredPermission={Permissions.CREATE_PROJECT}>
            <Link
              to={`/workspace/${workspaceId}/issues`}
              className="flex size-5 items-center justify-center rounded-full border"
            >
              <Plus className="size-3.5" />
            </Link>
          </PermissionsGuard>
        </SidebarGroupLabel>
        <SidebarMenu className="h-[320px] scrollbar overflow-y-auto pb-2">
          <div className="pl-3">
            <p className="text-xs text-muted-foreground">
              Issues are managed directly in your workspace. Create epics, stories, tasks, and bugs here.
            </p>
          </div>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
