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
      const member = members.find((m: any) => {
        // member.userId may be object or id string
        const userId = m?.userId?._id || m?.userId;
        const memberEmail = m?.userId?.email;
        
        // Match by ID first, then by email as fallback
        const idMatch = userId === user._id;
        const emailMatch = memberEmail && user.email && memberEmail === user.email;
        
        console.log('[usePermissions] Checking member:', {
          userId,
          memberEmail,
          currentUserId: user._id,
          currentUserEmail: user.email,
          idMatch,
          emailMatch,
          willMatch: idMatch || emailMatch
        });
        
        return idMatch || emailMatch;
      });
      
      console.log('[usePermissions] Found member:', member);
      
      if (member && member.role) {
        const perms = member.role.permissions || [];
        console.log('[usePermissions] Setting permissions:', perms);
        setPermissions(perms);
      } else {
        console.log('[usePermissions] No member found or no role, setting empty permissions');
        setPermissions([]);
      }
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;
