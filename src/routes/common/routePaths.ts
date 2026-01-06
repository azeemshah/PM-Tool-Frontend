export const isAuthRoute = (pathname: string): boolean => {
  // Check if it's a standard auth route
  if (Object.values(AUTH_ROUTES).includes(pathname)) {
    return true;
  }
  // Check if it's an invite route
  if (pathname.includes("/invite/workspace/") && pathname.includes("/join")) {
    return true;
  }
  return false;
};

export const AUTH_ROUTES = {
  SIGN_IN: "/",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CHANGE_PASSWORD: "/change-password",
  GOOGLE_OAUTH_CALLBACK: "/google/oauth/callback",
};

export const PROTECTED_ROUTES = {
  WORKSPACE: "/workspace/:workspaceId",
  BOARD: "/workspace/:workspaceId/board",
  BOARD_DETAIL: "/workspace/:workspaceId/boards/:boardId",
  TASKS: "/workspace/:workspaceId/tasks",
  MEMBERS: "/workspace/:workspaceId/members",
  SETTINGS: "/workspace/:workspaceId/settings",
  PROJECT_DETAILS: "/workspace/:workspaceId/project/:projectId",
  WORKFLOWS: "/workspace/:workspaceId/workflows",
};

export const BASE_ROUTE = {
  INVITE_URL: "/invite/workspace/:inviteCode/join",
};
