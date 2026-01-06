/**
 * Member API Types
 */

export interface Member {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
  workspaceId: string;
  roleId: {
    _id: string;
    name: string;
    permissions?: string[];
  };
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberDTO {
  userId: string;
  workspaceId: string;
  roleId: string;
}

export interface UpdateMemberDTO {
  roleId: string;
}

export interface JoinWorkspaceDTO {
  inviteCode: string;
}

export interface MemberStats {
  totalMembers: number;
  membersByRole: {
    _id: string;
    count: number;
    role: {
      _id: string;
      name: string;
    };
  }[];
}

export interface MemberResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface UserRole {
  memberId: string;
  role: string;
  permissions: string[];
  joinedAt: string;
}

export interface JoinWorkspaceResponse {
  workspaceId: string;
  role: string;
  message: string;
}
