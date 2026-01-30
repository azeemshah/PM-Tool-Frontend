import { CustomError } from "@/types/custom-error.type";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api/v1";

// Kanban boards storage in memory
const sampleBoards: any[] = [];
let boardIdCounter = 1;

// Provide either a mock API (when no backend URL) or a real axios instance.
let API: any;

if (!baseURL) {
  const sampleWorkspace = {
    _id: "local-ws",
    name: "Local Workspace",
    description: "A local workspace (no backend)",
    owner: "local-user",
    inviteCode: "LOCAL123",
  };

  const sampleUser = {
    _id: "local-user",
    name: "Local User",
    email: "local@example.com",
    profilePicture: null,
    isActive: true,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentWorkspace: {
      _id: sampleWorkspace._id,
      name: sampleWorkspace.name,
      owner: sampleWorkspace.owner,
      inviteCode: sampleWorkspace.inviteCode,
    },
  };

  const sampleTasks = [
    {
      _id: "task-1",
      title: "Create wireframes",
      description: "Landing page wireframes",
      priority: "medium",
      status: "todo",
      assignedTo: { _id: sampleUser._id, name: sampleUser.name, profilePicture: sampleUser.profilePicture },
      createdBy: sampleUser._id,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      taskCode: "T-001",
    },
  ];

  const sampleRoles = [
    { _id: "role-1", name: "Owner" },
    { _id: "role-2", name: "Member" },
  ];

  const sampleMembers = [
    {
      _id: "mem-1",
      userId: { _id: sampleUser._id, name: sampleUser.name, email: sampleUser.email, profilePicture: sampleUser.profilePicture },
      workspaceId: sampleWorkspace._id,
      role: { _id: sampleRoles[0]._id, name: sampleRoles[0].name },
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const emptyPagination = {
    totalCount: sampleTasks.length,
    pageSize: 10,
    pageNumber: 1,
    totalPages: 1,
    skip: 0,
    limit: sampleTasks.length,
  };

  API = {
    get: async (url: string) => {
      if (url.includes("/workspace/all")) {
        return { data: { message: "local", workspaces: [sampleWorkspace] } };
      }

      if (url.includes("/workspace/members")) {
        return { data: { message: "local", members: sampleMembers, roles: sampleRoles } };
      }

      if (url.includes("/workspace/analytics")) {
        return {
          data: {
            message: "local",
            analytics: { totalTasks: sampleTasks.length, overdueTasks: 0, completedTasks: 0 },
          },
        };
      }

      if (url.includes("/task/workspace") && url.includes("/all")) {
        return { data: { message: "local", tasks: sampleTasks, pagination: emptyPagination } };
      }

      if (url.includes("/user/current")) {
        // Check if user is authenticated by looking at localStorage
        const isAuthenticated = localStorage.getItem("mockAuthToken") === "true";
        if (!isAuthenticated) {
          throw new Error("Unauthorized");
        }
        return { data: { message: "local", user: sampleUser } };
      }

      if (url.match(/\/workspace\/[a-zA-Z0-9\-]+$/)) {
        return { data: { message: "local", workspace: { ...sampleWorkspace, members: sampleMembers } } };
      }

      // Kanban boards endpoints (GET)
      if (url.includes("/kanban/boards") && !url.includes("/columns") && !url.includes("/items")) {
        return { data: sampleBoards };
      }

      if (url.match(/\/kanban\/boards\/[a-zA-Z0-9]+$/)) {
        const match = url.match(/\/kanban\/boards\/([a-zA-Z0-9]+)$/);
        const boardId = match ? match[1] : null;
        const board = sampleBoards.find((b) => b._id === boardId);
        if (board) {
          return { data: board };
        }
        throw new Error("Board not found");
      }

      // Default fallback
      return { data: {} };
    },
    post: async (url: string, _data?: any) => {
      if (url.includes("/auth/login")) {
        // Store auth state when user logs in
        localStorage.setItem("mockAuthToken", "true");
        return { data: { message: "logged in (local)", user: sampleUser } };
      }
      if (url.includes("/auth/register")) {
        // Store auth state when user registers
        localStorage.setItem("mockAuthToken", "true");
        return { data: { message: "registered (local)", user: sampleUser } };
      }
      if (url.includes("/auth/logout")) {
        // Clear auth state when user logs out
        localStorage.removeItem("mockAuthToken");
        return { data: { message: "logged out (local)" } };
      }
      if (url.includes("/workspace/create/new")) {
        return { data: { message: "created (local)", workspace: sampleWorkspace } };
      }
      if (url.includes("/member/workspace") && url.includes("/join")) {
        return { data: { message: "joined (local)", workspaceId: sampleWorkspace._id } };
      }
      // also support new endpoint path used by backend
      if (url.includes("/members/join/")) {
        return { data: { message: "joined (local)", workspaceId: sampleWorkspace._id } };
      }

      // Email invite acceptance
      if (url.includes("/members/invite/accept")) {
        console.log("[Mock] Accept invitation called");
        localStorage.setItem("mockAuthToken", "true");
        return { 
          data: { 
            message: "Login successful (local)",
            accessToken: "mock-token-" + Date.now(),
            member: {
              id: sampleUser._id,
              email: sampleUser.email,
              role: "Member"
            }
          } 
        };
      }

      // Kanban: Create board (POST)
      if (url.includes("/kanban/boards") && !url.includes("/columns") && !url.includes("/items")) {
        const newBoard = {
          _id: `board-${boardIdCounter++}`,
          name: _data?.name || "New Board",
          description: _data?.description || "",
          columns: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        sampleBoards.push(newBoard);
        console.log("Board created in mock API:", newBoard);
        return { data: newBoard };
      }

      // Default fallback for POST
      return { data: { message: "ok (local)" } };
    },
    put: async (_url: string, _data?: any) => {
      return { data: { message: "updated (local)" } };
    },
    delete: async (_url: string) => {
      return { data: { message: "deleted (local)" } };
    },
  };
} else {
  const options = {
    baseURL,
    withCredentials: true,
    timeout: 10000,
  };

  API = axios.create(options);

  // Add request interceptor to include JWT token from localStorage
  API.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  API.interceptors.response.use(
    (response: any) => {
      return response;
    },
    async (error: any) => {
      const { data, status } = error.response || {};

      // Handle 403 Forbidden - Insufficient permissions
      if (status === 403) {
        const customError: CustomError = {
          ...error,
          errorCode: data?.errorCode || "FORBIDDEN",
          response: {
            ...error.response,
            data: {
              ...data,
              message: data?.message || "Insufficient permission",
            },
          },
        };
        return Promise.reject(customError);
      }

      // Attempt to refresh access token on 401 responses and retry once
      const originalRequest = error.config;
      if (status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        try {
          const refreshResp = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
          const accessToken = refreshResp?.data?.accessToken;
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return API(originalRequest);
          }
        } catch (refreshErr) {
          // Refresh failed - clear auth and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          delete API.defaults.headers.common['Authorization'];
          window.location.href = "/";
        }
      }

      // On 401 unauthorized, clear auth state and redirect
      if (status === 401 || data === "Unauthorized") {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete API.defaults.headers.common['Authorization'];
        window.location.href = "/";
      }

      const customError: CustomError = {
        ...error,
        errorCode: data?.errorCode || "UNKNOWN_ERROR",
      };

      return Promise.reject(customError);
    }
  );
}

export default API;






