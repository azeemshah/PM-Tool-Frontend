import { PermissionType } from "@/constant";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import { useEffect, useMemo, useState } from "react";

const usePermissions = (
  user: UserType | undefined,
  workspace: WorkspaceWithMembersType | undefined
) => {
  const [permissions, setPermissions] = useState<PermissionType[]>([]);

  useEffect(() => {
    if (user && workspace) {
      const members = (workspace as any).members || [];
      
      console.log('[usePermissions] Full debug:', {
        user: { _id: user._id, email: user.email },
        membersCount: members.length,
        members: members.map((m: any) => ({
          userIdType: typeof m?.userId,
          userId: m?.userId,
          role: m?.role,
        })),
      });
      
      const member = members.find((m: any) => {
        // member.userId may be object or id string
        // Handle both cases: userId as object with _id property or as string
        const userId = typeof m?.userId === 'object' 
          ? m?.userId?._id 
          : m?.userId;
        const memberEmail = typeof m?.userId === 'object'
          ? m?.userId?.email
          : undefined;
        
        console.log('[usePermissions] Checking member:', {
          userIdValue: userId,
          userIdStringified: userId?.toString(),
          userIdMatch: userId?.toString() === user._id?.toString(),
          memberEmail,
          emailMatch: memberEmail?.toLowerCase() === user.email?.toLowerCase(),
        });
        
        // Match by ID first, then by email as fallback
        const idMatch = userId && user._id && userId.toString() === user._id.toString();
        const emailMatch = memberEmail && user.email && memberEmail.toLowerCase() === user.email.toLowerCase();
        
        return idMatch || emailMatch;
      });
      
      console.log('[usePermissions] Found member:', member, 'Role:', member?.role);
      
      if (member && member.role) {
        const perms = member.role.permissions || [];
        console.log('[usePermissions] Setting permissions:', perms);
        setPermissions(perms);
      } else {
        console.log('[usePermissions] No member found or no role');
        setPermissions([]);
      }
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;





