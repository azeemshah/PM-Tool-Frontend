import {
  PermissionType,
  TaskPriorityEnumType,
  TaskStatusEnumType,
} from "@/constant";

export type loginType = { email: string; password: string };
export type LoginResponseType = {
  message: string;
  token?: string;
  accessToken?: string;
  user: {
    _id: string;
    currentWorkspace: string | { _id: string };
  };
};

export type registerType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// USER TYPE
export type UserType = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  isActive: true;
  lastLogin: null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace: {
    _id: string;
    name: string;
    owner: string;
    inviteCode: string;
  };
};

export type CurrentUserResponseType = {
  message: string;
  user: UserType;
};

//******** */ WORLSPACE TYPES ****************
// ******************************************
export type WorkspaceType = {
  id: string;
  _id: string;
  name: string;
  description?: string;
  boardType: 'kanban' | 'scrumboard';
  owner: string;
  inviteCode: string;
};

export type CreateWorkspaceType = {
  name: string;
  description: string;
  boardType: 'kanban' | 'scrumboard';
};

export type EditWorkspaceType = {
  workspaceId: string;
  data: {
    name: string;
    description: string;
  };
};

export type CreateWorkspaceResponseType = {
  message: string;
  workspace: WorkspaceType;
};

export type AllWorkspaceResponseType = {
  message: string;
  workspaces: WorkspaceType[];
};

export type WorkspaceWithMembersType = WorkspaceType & {
  members: {
    _id: string;
    userId: string;
    workspaceId: string;
    role: {
      _id: string;
      name: string;
      permissions: PermissionType[];
    };
    joinedAt: string;
    createdAt: string;
  }[];
};

export type WorkspaceByIdResponseType = {
  message: string;
  workspace: WorkspaceWithMembersType;
};

export type ChangeWorkspaceMemberRoleType = {
  workspaceId: string;
  data: {
    roleId: string;
    memberId: string;
  };
};

export type AllMembersInWorkspaceResponseType = {
  message: string;
  members: {
    user: { _id: string; name: string; firstName?: string; lastName?: string; email: string; profilePicture: string | null; };
    _id: string;
    userId: {
      _id: string;
      name: string;
      firstName?: string;
      lastName?: string;
      email: string;
      profilePicture: string | null;
    };
    userName?: string;
    workspaceId: string;
    roleId?: {
      _id: string;
      name: string;
      permissions?: PermissionType[];
    };
    role?: string | {
      _id: string;
      name: string;
      permissions?: PermissionType[];
    };
    invitedBy?: string | null;
    joinedAt: string;
    createdAt: string;
  }[];
  roles: RoleType[];
};

export type AnalyticsResponseType = {
  message: string;
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
  remainingTasks: number;
  remainingPoints: number;
  remainingHours: number;
};

export type PaginationType = {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  skip: number;
  limit: number;
};

export type RoleType = {
  _id: string;
  name: string;
};
// *********** MEMBER ****************

//********** */ TASK TYPES ************************
//************************************************* */

export type CreateTaskPayloadType = {
  workspaceId: string;
  data: {
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string;
    dueDate: string;
  };
};


//added new for edtiting of task
export type EditTaskPayloadType = {
  taskId: string;
  workspaceId: string;
  data: Partial<{
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string;
    dueDate: string;
  }>;
};


export type TaskType = {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriorityEnumType;
  status: TaskStatusEnumType;
  project?: {
    _id: string;
    name: string;
    emoji?: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    profilePicture: string | null;
  } | null;
  reporter?: {
    _id: string;
    name: string;
    profilePicture: string | null;
  } | null;
  createdBy?: string;
  dueDate: string;
  taskCode: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AllTaskPayloadType = {
  workspaceId: string;
  keyword?: string | null;
  priority?: TaskPriorityEnumType | null;
  status?: TaskStatusEnumType | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  page?: number | null;
  pageNumber?: number | null;
  pageSize?: number | null;
};

export type AllTaskResponseType = {
  message: string;
  tasks: TaskType[];
  pagination: PaginationType;
};





