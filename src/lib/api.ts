import API from "./axios-client";
import {
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  EditTaskPayloadType,
  CreateWorkspaceResponseType,
  EditProjectPayloadType,
  ProjectByIdPayloadType,
  ProjectResponseType,
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

export const refreshTokenMutationFn = async (): Promise<{ accessToken: string }> => {
  const response = await API.post('/auth/refresh');
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
  } catch (e) {}
  return response.data;
};

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
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
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
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
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  try {
    const response = await API.get(`/workspace/analytics/${workspaceId}`);
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

// ================= Kanban / Boards =================
export const moveWorkItemMutationFn = async ({ boardId, data }: { boardId: string; data: any }) => {
  try {
    const response = await API.post(`/boards/${boardId}/move-work-item`, data);
    return response.data;
  } catch (err: any) {
    console.warn('moveWorkItemMutationFn failed, applying optimistic UI only', err?.message || err);
    // Return a lightweight fallback so callers can proceed without throwing
    return { success: false, offline: true } as any;
  }
};

// Reorder columns on board via board update (persist columns array)
export const reorderColumnsMutationFn = async ({ boardId, data }: { boardId: string; data: { columns: string[] } }) => {
  try {
    // Use updateBoardMutationFn with columns field to persist reorder
    const response = await API.put(`/boards/${boardId}`, data);
    return response.data;
  } catch (err: any) {
    console.warn('reorderColumnsMutationFn failed, applying optimistic UI only', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

// ================ Boards (CRUD) ==================
export const createBoardMutationFn = async ({ workspaceId, projectId, data }: { workspaceId?: string; projectId?: string; data: any }) => {
  try {
    const payload = { workspaceId, projectId, ...data };
    const response = await API.post(`/boards`, payload);
    return response.data;
  } catch (err: any) {
    console.warn('createBoardMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const updateBoardMutationFn = async ({ boardId, data }: { boardId: string; data: any }) => {
  try {
    const response = await API.put(`/boards/${boardId}`, data);
    return response.data;
  } catch (err: any) {
    console.warn('updateBoardMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const deleteBoardMutationFn = async (boardId: string) => {
  try {
    const response = await API.delete(`/boards/${boardId}`);
    return response.data;
  } catch (err: any) {
    console.warn('deleteBoardMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

// ================ Columns ==================
export const createColumnMutationFn = async ({ boardId, data }: { boardId: string; data: any }) => {
  try {
    const response = await API.post(`/boards/${boardId}/columns`, data);
    return response.data;
  } catch (err: any) {
    console.warn('createColumnMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const updateColumnMutationFn = async ({ boardId, columnId, data }: { boardId: string; columnId: string; data: any }) => {
  try {
    const response = await API.put(`/boards/${boardId}/columns/${columnId}`, data);
    return response.data;
  } catch (err: any) {
    console.warn('updateColumnMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const deleteColumnMutationFn = async ({ boardId, columnId }: { boardId: string; columnId: string }) => {
  try {
    const response = await API.delete(`/boards/${boardId}/columns/${columnId}`);
    return response.data;
  } catch (err: any) {
    console.warn('deleteColumnMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

// ================ Work Items (CRUD) ==================
export const createWorkItemMutationFn = async ({ data }: { data: any }) => {
  try {
    const response = await API.post(`/kanban/items`, data);
    return response.data;
  } catch (err: any) {
    console.warn('createWorkItemMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const getWorkItemByIdQueryFn = async (workItemId: string) => {
  try {
    const response = await API.get(`/kanban/items/${workItemId}`);
    return response.data;
  } catch (err: any) {
    console.warn('getWorkItemByIdQueryFn failed', err?.message || err);
    return null as any;
  }
};

export const updateWorkItemMutationFn = async ({ workItemId, data }: { workItemId: string; data: any }) => {
  try {
    const response = await API.put(`/kanban/items/${workItemId}`, data);
    return response.data;
  } catch (err: any) {
    console.warn('updateWorkItemMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

export const deleteWorkItemMutationFn = async (workItemId: string) => {
  try {
    const response = await API.delete(`/kanban/items/${workItemId}`);
    return response.data;
  } catch (err: any) {
    console.warn('deleteWorkItemMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

// ================ Comments & Attachments ==================
export const getCommentsByWorkItemQueryFn = async (workItemId: string) => {
  try {
    const response = await API.get(`/kanban/comments`, { params: { workItemId } });
    return response.data;
  } catch (err: any) {
    console.warn('getCommentsByWorkItemQueryFn failed', err?.message || err);
    return [] as any;
  }
};

export const postCommentMutationFn = async ({ workItemId, data }: { workItemId: string; data: any }) => {
  try {
    const payload = { workItemId, ...data };
    const response = await API.post(`/kanban/comments`, payload);
    return response.data;
  } catch (err: any) {
    console.warn('postCommentMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
  }
};

// Post attachment metadata (fileUrl and fileName) to backend
// Note: File upload should be done separately to external storage (S3, Azure, etc.)
// This function posts the attachment metadata after file is uploaded externally
export const uploadAttachmentMutationFn = async ({ workItemId, fileUrl, fileName }: { workItemId?: string; fileUrl: string; fileName: string }) => {
  try {
    const payload = { workItem: workItemId, fileName, fileUrl };
    const response = await API.post(`/kanban/files`, payload);
    return response.data;
  } catch (err: any) {
    console.warn('uploadAttachmentMutationFn failed', err?.message || err);
    return { success: false, offline: true } as any;
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
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  iniviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  const response = await API.post(`/member/workspace/${iniviteCode}/join`);
  return response.data;
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  // include workspaceId together with project data so backend can associate project
  const payload = { workspaceId, ...data } as any;
  const response = await API.post(`/projects`, payload);
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/projects/${projectId}`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const queryParams = new URLSearchParams();
  if (workspaceId) queryParams.append("workspaceId", workspaceId);
  if (pageNumber) queryParams.append("pageNumber", String(pageNumber));
  if (pageSize) queryParams.append("pageSize", String(pageSize));

  const url = queryParams.toString() ? `/projects?${queryParams.toString()}` : `/projects`;
  const response = await API.get(url);
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/projects/${projectId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  // Backend exposes analytics at /projects/:projectId/analytics
  const response = await API.get(`/projects/${projectId}/analytics`);
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/projects/${projectId}`
  );
  return response.data;
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
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  // Call backend global tasks endpoint
  const baseUrl = `/projects/tasks`;
  const queryParams = new URLSearchParams();
  if (workspaceId) queryParams.append('workspaceId', workspaceId);
  if (keyword) queryParams.append('keyword', keyword);
  if (projectId) queryParams.append('projectId', projectId);
  if (assignedTo) queryParams.append('assignedTo', assignedTo);
  if (priority) queryParams.append('priority', priority as any);
  if (status) queryParams.append('status', status as any);
  if (dueDate) queryParams.append('dueDate', dueDate as any);
  if (pageNumber) queryParams.append('pageNumber', pageNumber?.toString());
  if (pageSize) queryParams.append('pageSize', pageSize?.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const bulkUpdateTasksMutationFn = async ({ ids, data }: { ids: string[]; data: { title?: string; description?: string; priority?: string; status?: string; assignedTo?: string; dueDate?: string } }) => {
  const response = await API.put(`/projects/tasks/bulk`, { ids, data });
  return response.data;
};

export const bulkDeleteTasksMutationFn = async ({ ids }: { ids: string[] }) => {
  const response = await API.delete(`/projects/tasks/bulk`, { data: { ids } });
  return response.data;
};


// Upload attachments for bugs
export const uploadBugAttachment = async ({
  bugId,
  file,
}: {
  bugId: string;
  file: File;
}) => {
  const form = new FormData();
  form.append('file', file);
  const response = await API.post(`/projects/bugs/${bugId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Upload attachments for tasks
export const uploadTaskAttachment = async ({
  taskId,
  file,
}: {
  taskId: string;
  file: File;
}) => {
  const form = new FormData();
  form.append('file', file);
  const response = await API.post(`/projects/tasks/${taskId}/attachments`, form, {
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
