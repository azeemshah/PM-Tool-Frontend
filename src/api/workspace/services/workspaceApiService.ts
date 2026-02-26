import API from "@/lib/axios-client";
import {
  CreateWorkspaceType,
  EditWorkspaceType,
  AllWorkspaceResponseType,
  WorkspaceByIdResponseType,
  CreateWorkspaceResponseType,
  AllMembersInWorkspaceResponseType,
  ChangeWorkspaceMemberRoleType,
} from "@/types/api.type";

export const workspaceApiService = {
  createWorkspace: async (
    data: CreateWorkspaceType
  ): Promise<CreateWorkspaceResponseType> => {
    const response = await API.post("/workspace/create/new", data);
    return response.data;
  },

  editWorkspace: async ({
    workspaceId,
    data,
  }: EditWorkspaceType) => {
    const response = await API.patch(`/workspace/${workspaceId}`, data);
    return response.data;
  },

  getAllWorkspacesUserIsMember: async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get("/workspace/all");
    return response.data;
  },

  getWorkspaceById: async (
    workspaceId: string
  ): Promise<WorkspaceByIdResponseType> => {
    const response = await API.get(`/workspace/${workspaceId}`);
    return response.data;
  },

  getMembers: async (
    workspaceId: string
  ): Promise<AllMembersInWorkspaceResponseType> => {
    try {
      // Try new NestJS endpoint first
      const response = await API.get(`/members/workspace/${workspaceId}`);
      const data = response.data.data;

      const members = Array.isArray(data) ? data : (data?.members || []);
      const roles = data?.roles || [];

      console.log("Members API response:", { response: response.data, members, roles });

      return {
        message: response.data.message || "Members retrieved",
        members: Array.isArray(members) ? members : [],
        roles: Array.isArray(roles) ? roles : [],
      };
    } catch (err: unknown) {
      console.error("Members API error:", err);
      // Fallback to old endpoint
      if ((err as any)?.response?.status === 404) {
        try {
          const response = await API.get(`/workspace/members/${workspaceId}`);
          const members = response.data.members || response.data.data || [];
          return {
            message: response.data.message || "Members retrieved",
            members: Array.isArray(members) ? members : [],
            roles: response.data.roles || [],
          };
        } catch {
          // Return empty members array if both fail
          return { message: "No members found", members: [], roles: [] };
        }
      }
      throw err;
    }
  },

  changeMemberRole: async ({
    data,
  }: ChangeWorkspaceMemberRoleType) => {
    const response = await API.put(`/members/${data.memberId}`, {
      roleId: data.roleId,
    });
    return response.data;
  },

  deleteWorkspace: async (
    workspaceId: string
  ): Promise<{
    message: string;
    currentWorkspace: string;
  }> => {
    const response = await API.delete(`/workspace/${workspaceId}`);
    return response.data;
  },

  inviteUserJoinWorkspace: async (
    inviteCode: string
  ): Promise<{
    message: string;
    workspaceId: string;
  }> => {
    const response = await API.post(`/members/join/${inviteCode}`);
    const responseData = response.data;

    if (responseData.data?.workspaceId) {
      return {
        message:
          responseData.message ||
          responseData.data.message ||
          "Successfully joined workspace",
        workspaceId: responseData.data.workspaceId,
      };
    }

    return {
      message: responseData.message || "Successfully joined workspace",
      workspaceId: responseData.workspaceId,
    };
  },
};
