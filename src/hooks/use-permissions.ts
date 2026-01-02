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
        return userId === user._id;
      });
      if (member && member.role) {
        setPermissions(member.role.permissions || []);
      } else {
        setPermissions([]);
      }
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;
