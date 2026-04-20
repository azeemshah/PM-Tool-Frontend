import { ChevronDown, Loader } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAvatarColor, getAvatarFallbackText, getProfileImageUrl } from "@/lib/helper";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApiService } from "@/api/workspace/services";
import { memberApiService } from "@/api/member/services/memberApiService";
import { toast } from "@/hooks/use-toast";
import { Permissions } from "@/constant";
import { showConfirmDialog } from "@/lib/modal-alert";
const AllMembers = () => {
  const { user, hasPermission } = useAuthContext();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const canChangeMemberRole = hasPermission(Permissions.CHANGE_MEMBER_ROLE);

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useGetWorkspaceMembers(workspaceId);
  const members = data?.members || [];
  const roles = data?.roles || [];

  // Default roles if API doesn't return them
  const availableRoles = roles.length > 0 ? roles : [
    { _id: 'admin', name: 'ADMIN' },
    { _id: 'member', name: 'MEMBER' },
  ];

  // Check if user is workspace owner by checking their member role
  // Try matching by both ID and email since IDs might not match perfectly
  const userMember = members.find((m: any) => {
    const memberId = typeof m?.userId === 'string' ? m?.userId : m?.userId?._id;
    const memberEmail = m?.userId?.email;
    const currentUserId = user?._id;
    const currentUserEmail = user?.email;
    
    const idMatch = memberId && currentUserId && memberId === currentUserId;
    const emailMatch = memberEmail && currentUserEmail && memberEmail === currentUserEmail;
    
    return idMatch || emailMatch;
  });
  
  const isWorkspaceOwner = userMember?.role === 'Owner' || (userMember?.role as any)?.name === 'OWNER';
  
  // Owner can always change roles, otherwise check permission
  const canChange = isWorkspaceOwner || canChangeMemberRole;

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: workspaceApiService.changeMemberRole,
  });

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: memberApiService.removeMember,
  });

  const handleSelect = (roleId: string, memberId: string) => {
    if (!roleId || !memberId) return;
    const payload = {
      workspaceId,
      data: {
        roleId,
        memberId,
      },
    };
    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        setOpenPopoverId(null);
        toast({
          title: "Success",
          description: "Member's role changed successfully",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleRemove = async (memberId: string) => {
    if (!memberId) return;

    const confirmed = await showConfirmDialog({
      title: "Remove member?",
      description: "Are you sure you want to remove this member from the workspace?",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;

    removeMember(memberId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        toast({
          title: "Success",
          description: "Member removed successfully",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="grid gap-6 pt-2">
      {isPending ? (
        <Loader className="w-8 h-8 animate-spin place-self-center flex" />
      ) : null}

      {members && members.length > 0 ? (
        members.map((member) => {
          if (!member) return null;
          // The backend returns { user: {...}, role: "..." } structure in the result array
          // See member.service.ts getWorkspaceMembers method
          const userObj = member.user || member.userId; 
          
          // Helper to get name from user object which might have firstName/lastName or just name
          const getName = (u: any) => {
             if (!u) return "Unknown User";
             if (u.name) return u.name;
             if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
             return "Unknown User";
          };

          const name = getName(userObj);
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);
          const email = userObj?.email || "No email";
          const memberId = userObj?._id || (typeof userObj === 'string' ? userObj : "");
          const roleName = typeof member.role === 'string' ? member.role : member.role?.name;
          const canRemoveMember =
            !!user?._id &&
            !!member.invitedBy &&
            member.invitedBy === user._id &&
            memberId !== user._id &&
            roleName !== 'Owner';

          return (
            <div key={member._id} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={getProfileImageUrl(userObj?.profilePicture) || ""}
                  alt="Image"
                />
                <AvatarFallback className={avatarColor}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canRemoveMember && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-w-20"
                  disabled={isLoading || isRemoving}
                  onClick={() => handleRemove(member._id)}
                >
                  Remove
                </Button>
              )}
              <Popover open={openPopoverId === member._id} onOpenChange={(open) => setOpenPopoverId(open ? member._id : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto min-w-24 disabled:opacity-95 disabled:pointer-events-none"
                    disabled={
                      isLoading ||
                      !canChange ||
                      memberId === user?._id
                    }
                  >
                    {(() => {
                      return roleName
                        ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
                        : 'Member';
                    })()}{' '}
                    {canChange && memberId !== user?._id && (
                      <ChevronDown className="text-muted-foreground" />
                    )}
                  </Button>
                </PopoverTrigger>
                {canChange && availableRoles && availableRoles.length > 0 && (
                  <PopoverContent className="p-0" align="end">
                    <Command>
                      <CommandInput
                        placeholder="Select new role..."
                        disabled={isLoading}
                        className="disabled:pointer-events-none"
                      />
                      <CommandList>
                        {isLoading ? (
                          <Loader className="w-8 h-8 animate-spin place-self-center flex my-4" />
                        ) : (
                          <>
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                              {availableRoles?.map(
                                (role) =>
                                  role.name !== "OWNER" && (
                                    <CommandItem
                                      key={role._id}
                                      disabled={isLoading}
                                      className="disabled:pointer-events-none gap-1 mb-1  flex flex-col items-start px-4 py-2 cursor-pointer"
                                      onSelect={() => {
                                        handleSelect(
                                          role._id,
                                          member._id
                                        );
                                      }}
                                    >
                                      <p className="capitalize">
                                        {role.name?.toLowerCase()}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {role.name === "ADMIN" &&
                                          `Can view, create, edit tasks, project and manage settings .`}

                                        {role.name === "MEMBER" &&
                                          `Can view,edit only task created by.`}
                                      </p>
                                    </CommandItem>
                                  )
                              )}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </div>
        );
      })
    ) : !isPending && members.length === 0 ? (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No members found in this workspace
      </div>
    ) : null}
    </div>
  );
};

export default AllMembers;





