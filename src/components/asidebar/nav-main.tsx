"use client";

import {
  LucideIcon,
  Settings,
  Users,
  CheckCircle,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceByIdQueryFn } from "@/lib/api";

type ItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function NavMain() {
  const workspaceId = useWorkspaceId();
  const location = useLocation();

  const pathname = location.pathname;

  const { data: workspaceData } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspaceByIdQueryFn(workspaceId),
    enabled: !!workspaceId,
  });

  const workspace = workspaceData?.workspace;
  const boardLabel = workspace?.boardType === "scrumboard" ? "Scrum Board" : "Kanban";

  const items: ItemType[] = [
    {
      title: "Dashboard",
      url: `/workspace/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Tasks",
      url: `/workspace/${workspaceId}/tasks`,
      icon: CheckCircle,
    },
    {
      title: boardLabel,
      url: `/workspace/${workspaceId}/board`,
      icon: LayoutDashboard,
    },
    {
      title: "History",
      url: `/workspace/${workspaceId}/history`,
      icon: Clock,
    },
    {
      title: "Members",
      url: `/workspace/${workspaceId}/members`,
      icon: Users,
    },
    {
      title: "Settings",
      url: `/workspace/${workspaceId}/settings`,
      icon: Settings,
    },
  ];
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton isActive={item.url === pathname} asChild>
              <Link to={item.url} className="!text-[15px]">
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}





