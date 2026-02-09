import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { EllipsisIcon, Loader, LogOut, Camera } from "lucide-react";
import { uploadProfilePictureMutationFn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { baseURL } from "@/lib/base-url";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import LogoutDialog from "./logout-dialog";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavMain } from "./nav-main";
import { Separator } from "../ui/separator";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";

const Asidebar = () => {
  const { isLoading, user, refetchAuth } = useAuthContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadProfilePictureMutationFn(file);
      refetchAuth();
      toast({ title: "Success", description: "Profile picture updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to update profile picture", variant: "destructive" });
    }
  };

  const { open } = useSidebar();
  const workspaceId = useWorkspaceId();

  const [isOpen, setIsOpen] = useState(false);

  const getProfileImageUrl = (path: string | null | undefined) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const host = baseURL.replace("/api/v1", "");
    return `${host}${path}`;
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <Sidebar collapsible="icon">
        <SidebarHeader className="!py-0 dark:bg-background">
          <div className="flex h-[50px] items-center justify-start w-full px-1">
            <Logo url={`/workspace/${workspaceId}`} />
            {open && (
              <Link
                to={`/workspace/${workspaceId}`}
                className="hidden md:flex ml-2 items-center gap-2 self-center font-medium"
              >
                PM-Tool
              </Link>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className=" !mt-0 dark:bg-background">
          <SidebarGroup className="!py-0">
            <SidebarGroupContent>
              <WorkspaceSwitcher />
              <Separator />
              <NavMain />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="dark:bg-background">
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoading ? (
                <Loader
                  size="24px"
                  className="place-self-center self-center animate-spin"
                />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="relative group">
                        <Avatar className="h-8 w-8 rounded-full">
                          <AvatarImage src={getProfileImageUrl(user?.profilePicture)} />
                          <AvatarFallback className="rounded-full border border-gray-500">
                            {user?.name && user.name.split(" ")?.[0]?.charAt(0)}
                            {user?.name && user.name.split(" ")?.[1]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name}
                        </span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                      <EllipsisIcon className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={"bottom"}
                    align="start"
                    sideOffset={4}
                  >
                    <DropdownMenuGroup></DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsOpen(true)}>
                      <LogOut />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <LogoutDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default Asidebar;





