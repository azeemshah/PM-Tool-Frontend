import API from "./axios-client";
import {
  AllMembersInWorkspaceResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateTaskPayloadType,
  EditTaskPayloadType,
  CreateWorkspaceResponseType,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
} from "@/types/api.type";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const registerMutationFn = async (data: registerType) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const forgotPasswordMutationFn = async (data: { email: string }) => {
  const response = await API.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPasswordMutationFn = async (data: { token: string; newPassword: string }) => {
  const response = await API.post('/auth/reset-password', data);
  return response.data;
};

export const changePasswordMutationFn = async (data: { currentPassword: string; newPassword: string }) => {
  const response = await API.post('/auth/change-password', data);
  return response.data;
};
export const logoutMutationFn = async () => await API.post("/auth/logout");
export const logoutAndClearAuth = async () => {
  const response = await API.post('/auth/logout');
  try {
    delete API.defaults.headers.common['Authorization'];
  } catch (e) { }
  return response.data;
};

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
    return response.data;
  };

export const uploadProfilePictureMutationFn = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const response = await API.post(`/user/profile-picture`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  const response = await API.patch(`/workspace/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get(`/workspace/all`);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  try {
    // Try new NestJS endpoint first
    const response = await API.get(`/members/workspace/${workspaceId}`);
    // NestJS returns { statusCode, message, data: { members: [...], roles: [...] } }
    const data = response.data.data;

    const members = Array.isArray(data) ? data : (data?.members || []);
    const roles = data?.roles || [];

    console.log('Members API response:', { response: response.data, members, roles });

    return {
      message: response.data.message || "Members retrieved",
      members: Array.isArray(members) ? members : [],
      roles: Array.isArray(roles) ? roles : []
    };
  } catch (err: any) {
    console.error('Members API error:', err);
    // Fallback to old endpoint
    if (err?.response?.status === 404) {
      try {
        const response = await API.get(`/workspace/members/${workspaceId}`);
        const members = response.data.members || response.data.data || [];
        return {
          message: response.data.message || "Members retrieved",
          members: Array.isArray(members) ? members : [],
          roles: response.data.roles || []
        };
      } catch {
        // Return empty members array if both fail
        return { message: "No members found", members: [], roles: [] };
      }
    }
    throw err;
  }
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string,
  timeframe?: string
): Promise<AnalyticsResponseType> => {
  try {
    const response = await API.get(`/workspace/analytics/${workspaceId}`, {
      params: { timeframe }
    });
    console.log('Workspace analytics response:', response.data);
    return response.data;
  } catch (err: any) {
    // If analytics endpoint is missing (404) or backend not ready,
    // return a safe default so dashboard/board components don't crash.
    if (err?.response?.status === 404) {
      return ({ analytics: { totalTasks: 0, overdueTasks: 0, completedTasks: 0 } } as any);
    }
    // rethrow other errors so auth/permission problems surface where appropriate
    throw err;
  }
};

export const getWorkspaceVelocityQueryFn = async (
  workspaceId: string,
  limit?: number
): Promise<any[]> => {
  try {
    const response = await API.get(`/workspace/velocity/${workspaceId}`, {
      params: { limit },
    });
    console.log('Workspace velocity response:', response.data);
    return response.data;
  } catch (err: any) {
    console.error('Error fetching workspace velocity:', err);
    throw err;
  }
};

export const getWorkspaceCFDQueryFn = async (
  workspaceId: string,
  timeframe: string
): Promise<any[]> => {
  try {
    const response = await API.get(
      `/workspace/cfd/${workspaceId}?timeframe=${timeframe}`
    );
    return response.data;
  } catch (err: any) {
    console.error("Error fetching workspace CFD:", err);
    throw err;
  }
};

// ================= Workflows =================
export const getWorkflowsQueryFn = async () => {
  const response = await API.get(`/workflows`);
  return response.data;
};

export const getWorkflowByIdQueryFn = async (workflowId: string) => {
  const response = await API.get(`/workflows/${workflowId}`);
  return response.data;
};

export const createWorkflowMutationFn = async (data: any) => {
  const response = await API.post(`/workflows`, data);
  return response.data;
};

export const updateWorkflowMutationFn = async ({ workflowId, data }: { workflowId: string; data: any }) => {
  const response = await API.put(`/workflows/${workflowId}`, data);
  return response.data;
};

export const deleteWorkflowMutationFn = async (workflowId: string) => {
  const response = await API.delete(`/workflows/${workflowId}`);
  return response.data;
};

export const getWorkflowStatesQueryFn = async (workflowId: string) => {
  const response = await API.get(`/workflows/${workflowId}/states`);
  return response.data;
};

export const createWorkflowStateMutationFn = async ({ workflowId, data }: { workflowId: string; data: any }) => {
  const response = await API.post(`/workflows/${workflowId}/states`, data);
  return response.data;
};

export const deleteWorkflowStateMutationFn = async ({ workflowId, stateId }: { workflowId: string; stateId: string }) => {
  const response = await API.delete(`/workflows/${workflowId}/states/${stateId}`);
  return response.data;
};

export const getWorkflowTransitionsQueryFn = async (workflowId: string) => {
  const response = await API.get(`/workflows/${workflowId}/transitions`);
  return response.data;
};

export const createWorkflowTransitionMutationFn = async ({ workflowId, data }: { workflowId: string; data: any }) => {
  const response = await API.post(`/workflows/${workflowId}/transitions`, data);
  return response.data;
};

export const deleteWorkflowTransitionMutationFn = async ({ workflowId, transitionId }: { workflowId: string; transitionId: string }) => {
  const response = await API.delete(`/workflows/${workflowId}/transitions/${transitionId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  // Use the members endpoint to update role
  // data contains: { roleId, memberId }
  const response = await API.put(
    `/members/${data.memberId}`,
    { roleId: data.roleId }
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  iniviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  const response = await API.post(`/members/join/${iniviteCode}`);
  // Handle both response structures: { data: { workspaceId, role } } or nested
  const responseData = response.data;

  if (responseData.data?.workspaceId) {
    // Response has nested data structure
    return {
      message: responseData.message || responseData.data.message || 'Successfully joined workspace',
      workspaceId: responseData.data.workspaceId,
    };
  }

  // Handle flat response structure
  return {
    message: responseData.message || 'Successfully joined workspace',
    workspaceId: responseData.workspaceId,
  };
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  storyId,
  data,
}: {
  storyId: string;
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}) => {
  const response = await API.post(`/projects/stories/${storyId}/tasks`, data);
  return response.data;
};

/**
 * Create Task WITHOUT Epic/Story
 * Used in All Tasks page and Project Dashboard
 */
export const createTaskWithoutEpicMutationFn = async ({
  workspaceId,
  data,
}: {
  workspaceId: string;
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    dueDate?: string;
    labels?: string[];
    tags?: string[];
  };
}) => {
  const response = await API.post(`/items/create`, {
    ...data,
    workspace: workspaceId,
    type: 'task',
  });
  return response.data;
};

export const getTasksQueryFn = async (storyId: string) => {
  const response = await API.get(`/projects/stories/${storyId}/tasks`);
  return response.data;
};

export const updateTaskMutationFn = async ({
  taskId,
  data,
}: {
  taskId: string;
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}) => {
  const response = await API.put(`/projects/tasks/${taskId}`, data);
  return response.data;
};

export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: {
  taskId: string;
  projectId: string;
  workspaceId: string;
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}) => {
  const response = await API.put(`/projects/tasks/${taskId}`, data);
  return response.data;
};

export const deleteTaskMutationFn = async (taskId: string) => {
  const response = await API.delete(`/projects/tasks/${taskId}`);
  return response.data;
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  assignedTo,
  priority,
  status,
  dueDate,
  page,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  // Fetch issues from workspace with server-side pagination and filtering
  try {
    const ps = pageSize || 10;
    const pn = page ?? pageNumber ?? 1;

    let allMapped: any[] = [];
    let totalCount = 0;

    // Fetch issues for the workspace with server-side pagination
    try {
      // Fetch issues for workspace with server-side pagination
      const issuesResp = await API.get(`/issues`, {
        params: {
          workspaceId,
          pageNumber: pn,
          pageSize: ps,
        },
      });

      const issuesData = issuesResp.data?.data || issuesResp.data || [];
      const pagination = issuesResp.data?.pagination || { totalCount: issuesData.length };
      totalCount = pagination.totalCount;

      allMapped = issuesData.map((iss: any) => {
        return {
          _id: iss._id,
          title: iss.title,
          description: iss.description,
          type: iss.type,
          priority: iss.priority,
          status: iss.status,
          assignedTo: iss.assignee
            ? {
              _id: iss.assignee._id,
              name: iss.assignee.name,
              profilePicture: iss.assignee.profilePicture || null,
            }
            : null,
          createdBy: iss.reporter?._id || undefined,
          dueDate: iss.dueDate || '',
          taskCode: iss.key || '',
          createdAt: iss.createdAt,
          updatedAt: iss.updatedAt,
        };
      });
    } catch (err) {
      console.error('Error fetching issues for workspace:', err);
      // Continue with empty allMapped in case of error
      allMapped = [];
    }

    // Apply client-side filtering on paginated data
    let filtered = allMapped;
    if (keyword) {
      filtered = filtered.filter(
        (t) =>
          (t.title || '')
            .toLowerCase()
            .includes(String(keyword).toLowerCase()) ||
          (t.taskCode || '')
            .toLowerCase()
            .includes(String(keyword).toLowerCase())
      );
    }
    if (assignedTo) {
      filtered = filtered.filter((t) => t.assignedTo && t.assignedTo._id === assignedTo);
    }
    if (priority) {
      filtered = filtered.filter(
        (t) =>
          (t.priority || '')
            .toLowerCase() === String(priority).toLowerCase()
      );
    }
    if (status) {
      filtered = filtered.filter(
        (t) =>
          (t.status || '')
            .toLowerCase() === String(status).toLowerCase()
      );
    }

    // Return paginated data with total count from server
    const totalPages = Math.ceil(totalCount / ps);
    return {
      tasks: filtered,
      pagination: {
        totalCount,
        pageNumber: pn,
        pageSize: ps,
        totalPages,
        skip: (pn - 1) * ps,
        limit: ps,
      },
      message: 'Success',
    };
  } catch (err: any) {
    console.error('getAllTasksQueryFn error:', err);
    const ps = pageSize || 10;
    const pn = pageNumber || 1;
    return {
      tasks: [],
      pagination: {
        totalCount: 0,
        pageNumber: pn,
        pageSize: ps,
        totalPages: 0,
        skip: (pn - 1) * ps,
        limit: ps,
      },
      message: 'Error',
    };
  }
};

export const bulkUpdateTasksMutationFn = async ({ ids, data }: { ids: string[]; data: { title?: string; description?: string; priority?: string; status?: string; assignedTo?: string; dueDate?: string } }) => {
  // Update each task individually since there's no bulk endpoint
  const promises = ids.map(id => updateIssueMutationFn({ issueId: id, data }));
  const results = await Promise.all(promises);
  return results;
};

export const bulkDeleteTasksMutationFn = async ({ ids }: { ids: string[] }) => {
  // Delete each task individually since there's no bulk endpoint
  const promises = ids.map(id => deleteIssueMutationFn(id));
  const results = await Promise.all(promises);
  return results;
};


// Upload attachment via Kanban files module (workItem-based)
export const uploadWorkItemAttachment = async ({
  workItemId,
  file,
}: {
  workItemId: string;
  file: File;
}) => {
  const form = new FormData();
  form.append('file', file);
  const response = await API.post(`/kanban/files/upload/${workItemId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
    // Delete attachment from task
export const deleteTaskAttachment = async ({ taskId, url }: { taskId: string; url: string }) => {
  const response = await API.delete(`/projects/tasks/${taskId}/attachments?url=${encodeURIComponent(url)}`);
  return response.data;
};

// Delete attachment from bug
export const deleteBugAttachment = async ({ bugId, url }: { bugId: string; url: string }) => {
  const response = await API.delete(`/projects/bugs/${bugId}/attachments?url=${encodeURIComponent(url)}`);
  return response.data;
};

// -------- Kanban Attachments (WorkItem-based) --------
export const getAllAttachments = async () => {
  const response = await API.get(`/kanban/files`);
  return response.data?.data || response.data || [];
};

export const getWorkItemAttachments = async (workItemId: string) => {
  const response = await API.get(`/kanban/files/work-item/${workItemId}`);
  const items = response.data?.data || response.data || [];
  return (items as any[]).map((a) => ({
    _id: a._id,
    url: a.fileUrl,
    name: a.fileName,
  }));
};

export const deleteAttachmentById = async (attachmentId: string) => {
  const response = await API.delete(`/kanban/files/${attachmentId}`);
  return response.data;
};

export const deleteAttachmentByUrl = async (url: string) => {
  const response = await API.delete(`/kanban/files/by-url?url=${encodeURIComponent(url)}`);
  return response.data;
};

//* EPICS */
export const createEpicMutationFn = async ({
  projectId,
  data,
}: {
  projectId: string;
  data: { title: string; description?: string };
}) => {
  const response = await API.post(`/projects/${projectId}/epics`, data);
  return response.data;
};

export const getEpicsQueryFn = async (projectId: string) => {
  const response = await API.get(`/projects/${projectId}/epics`);
  return response.data;
};

export const updateEpicMutationFn = async ({
  epicId,
  data,
}: {
  epicId: string;
  data: { title?: string; description?: string };
}) => {
  const response = await API.put(`/projects/epics/${epicId}`, data);
  return response.data;
};

export const deleteEpicMutationFn = async (epicId: string) => {
  const response = await API.delete(`/projects/epics/${epicId}`);
  return response.data;
};

//* STORIES */
export const createStoryMutationFn = async ({
  epicId,
  data,
}: {
  epicId: string;
  data: { title: string; description?: string };
}) => {
  const response = await API.post(`/projects/epics/${epicId}/stories`, data);
  return response.data;
};

export const getStoriesQueryFn = async (epicId: string) => {
  const response = await API.get(`/projects/epics/${epicId}/stories`);
  return response.data;
};

export const updateStoryMutationFn = async ({
  storyId,
  data,
}: {
  storyId: string;
  data: { title?: string; description?: string };
}) => {
  const response = await API.put(`/projects/stories/${storyId}`, data);
  return response.data;
};

export const deleteStoryMutationFn = async (storyId: string) => {
  const response = await API.delete(`/projects/stories/${storyId}`);
  return response.data;
};

//* SUBTASKS */
export const createSubtaskMutationFn = async ({
  taskId,
  data,
}: {
  taskId: string;
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
  };
}) => {
  const response = await API.post(`/projects/tasks/${taskId}/subtasks`, data);
  return response.data;
};

export const getSubtasksQueryFn = async (taskId: string) => {
  const response = await API.get(`/projects/tasks/${taskId}/subtasks`);
  return response.data;
};

export const updateSubtaskMutationFn = async ({
  subtaskId,
  data,
}: {
  subtaskId: string;
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
  };
}) => {
  const response = await API.put(`/projects/subtasks/${subtaskId}`, data);
  return response.data;
};

export const deleteSubtaskMutationFn = async (subtaskId: string) => {
  const response = await API.delete(`/projects/subtasks/${subtaskId}`);
  return response.data;
};

//* ISSUES (New Unified API) */

/**
 * Update an Issue
 * PATCH /issues/:id
 */
export const updateIssueMutationFn = async ({
  issueId,
  data,
}: {
  issueId: string;
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignee?: string;
    dueDate?: string;
  };
}) => {
  const response = await API.patch(`/issues/${issueId}`, data);
  return response.data;
};

/**
 * Delete an Issue
 * DELETE /items/delete/:id
 */
export const deleteIssueMutationFn = async (issueId: string) => {
  const response = await API.delete(`/items/delete/${issueId}`);
  return response.data;
};





