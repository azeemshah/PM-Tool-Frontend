import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "./ui/separator";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { ModeToggle } from "./mode-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationList } from "./notification/notification-list";

const Header = () => {
  const location = useLocation();
  const workspaceId = useWorkspaceId();
  const { unreadCount } = useNotifications();

  const pathname = location.pathname;

  const getPageLabel = (pathname: string) => {
    if (pathname.includes("/project/")) return "Project";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/members")) return "Members";
    return null; // Default label
  };

  const pageHeading = getPageLabel(pathname);
  return (
    <header className="flex sticky top-0 z-50 bg-background h-12 shrink-0 items-center border-b px-3">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block text-[15px]">
              {pageHeading ? (
                <BreadcrumbLink asChild>
                  <Link to={`/workspace/${workspaceId}`}>Dashboard</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="line-clamp-1 ">
                  Dashboard
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>

            {pageHeading && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="text-[15px]">
                  <BreadcrumbPage className="line-clamp-1">
                    {pageHeading}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto border-none" align="end">
                <NotificationList />
            </PopoverContent>
        </Popover>
        <ModeToggle />
      </div>
    </header>
  );
};

export default Header;





