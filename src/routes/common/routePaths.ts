export const isAuthRoute = (pathname: string): boolean => {
  // Check if it's a standard auth route
  if (Object.values(AUTH_ROUTES).includes(pathname)) {
    return true;
  }
  // Check if it's an invite route (both workspace invite and token invite)
  if (pathname.includes("/invite/workspace/") && pathname.includes("/join")) {
    return true;
  }
  // Check if it's a token-based invite route (handled via query params in Outlet check)
  if (pathname === "/invite") {
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
  VERIFY_EMAIL: "/verify-email",
  CHECK_EMAIL: "/check-email",
  VERIFY_OTP: "/verify-otp",
};

export const PROTECTED_ROUTES = {
  WORKSPACE: "/workspace/:workspaceId",
  BOARD: "/workspace/:workspaceId/board",
  BOARD_DETAIL: "/workspace/:workspaceId/boards/:boardId",
  TASKS: "/workspace/:workspaceId/tasks",
  MEMBERS: "/workspace/:workspaceId/members",
  SETTINGS: "/workspace/:workspaceId/settings",
  WORKFLOWS: "/workspace/:workspaceId/workflows",
};

export const BASE_ROUTE = {
  INVITE_URL: "/invite/workspace/:inviteCode/join",
};





