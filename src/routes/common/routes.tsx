import GoogleOAuthFailure from "@/page/auth/GoogleOAuthFailure";
import SignIn from "@/page/auth/Sign-in";
import SignUp from "@/page/auth/Sign-up";
import ForgotPassword from "@/page/auth/Forgot-password";
import ResetPassword from "@/page/auth/Reset-password";
import ChangePassword from "@/page/auth/Change-password";
import WorkspaceDashboard from "@/page/workspace/Dashboard";
import Members from "@/page/workspace/Members";
import Settings from "@/page/workspace/Settings";
import Tasks from "@/page/workspace/Tasks";
import BoardPage from "@/page/workspace/Board";
import WorkflowPage from "@/page/workspace/Workflow";
import { AUTH_ROUTES, BASE_ROUTE, PROTECTED_ROUTES } from "./routePaths";
import InviteUser from "@/page/invite/InviteUser";
import AcceptInvite from "@/page/invite/AcceptInvite";

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: <SignIn /> },
  { path: AUTH_ROUTES.SIGN_UP, element: <SignUp /> },
  { path: AUTH_ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
  { path: AUTH_ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
  { path: AUTH_ROUTES.CHANGE_PASSWORD, element: <ChangePassword /> },
  { path: AUTH_ROUTES.GOOGLE_OAUTH_CALLBACK, element: <GoogleOAuthFailure /> },
];

export const protectedRoutePaths = [
  { path: PROTECTED_ROUTES.WORKSPACE, element: <WorkspaceDashboard /> },
  { path: PROTECTED_ROUTES.WORKFLOWS, element: <WorkflowPage /> },
  { path: PROTECTED_ROUTES.BOARD, element: <BoardPage /> },
  { path: PROTECTED_ROUTES.BOARD_DETAIL, element: <BoardPage /> },
  { path: PROTECTED_ROUTES.TASKS, element: <Tasks /> },
  { path: PROTECTED_ROUTES.MEMBERS, element: <Members /> },
  { path: PROTECTED_ROUTES.SETTINGS, element: <Settings /> },
];

export const baseRoutePaths = [
  { path: BASE_ROUTE.INVITE_URL, element: <InviteUser /> },
  { path: "/invite", element: <AcceptInvite /> },
];





