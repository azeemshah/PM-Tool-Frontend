import { PermissionType, Permissions } from "@/constant";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import { useEffect, useMemo, useState } from "react";

// Role to permissions mapping
const rolePermissions: Record<string, PermissionType[]> = {
  Owner: [
    Permissions.CREATE_WORKSPACE,
    Permissions.DELETE_WORKSPACE,
    Permissions.EDIT_WORKSPACE,
    Permissions.ADD_MEMBER,
    Permissions.CHANGE_MEMBER_ROLE,
    Permissions.REMOVE_MEMBER,
    Permissions.CREATE_PROJECT,
    Permissions.EDIT_PROJECT,
    Permissions.DELETE_PROJECT,
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  Admin: [
    Permissions.ADD_MEMBER,
    Permissions.CHANGE_MEMBER_ROLE,
    Permissions.REMOVE_MEMBER,
    Permissions.CREATE_PROJECT,
    Permissions.EDIT_PROJECT,
    Permissions.DELETE_PROJECT,
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  Member: [
    Permissions.CREATE_PROJECT,
    Permissions.EDIT_PROJECT,
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  Viewer: [
    Permissions.VIEW_ONLY,
  ],
};

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

      setPermissions(userPermissions);
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;
