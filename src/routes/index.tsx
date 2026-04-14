import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./protected.route";
import AuthRoute from "./auth.route";
import {
  authenticationRoutePaths,
  baseRoutePaths,
  protectedRoutePaths,
} from "./common/routes";
import AppLayout from "@/layout/app.layout";
import BaseLayout from "@/layout/base.layout";
import NotFound from "@/page/errors/NotFound";
import WorkspaceRedirect from "@/page/workspace/WorkspaceRedirect";
// import { KanbanLayout } from "@/components/kanban";
// import { KanbanBoardView } from "@/components/kanban";
// import { BoardsView } from "@/components/kanban/views/BoardsView";
// import { KanbanAppContextProvider } from "@/contexts/KanbanAppContext";
import { Suspense } from "react";

function AppRoutes() {
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BaseLayout />}>
          {baseRoutePaths.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        <Route path="/" element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Protected Route */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Redirect /workspace to /workspace/:workspaceId */}
            <Route path="workspace" element={<WorkspaceRedirect />} />
            {protectedRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>

          {/* Kanban Routes - Disabled due to type errors */}
          {/* <Route
            path="Kanban"
            element={
              <KanbanAppContextProvider>
                <KanbanLayout />
              </KanbanAppContextProvider>
            }
          >
            <Route path="boards" element={<BoardsView />} />
            <Route
              path="boards/:boardId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <KanbanBoardView />
                </Suspense>
              }
            />
          </Route> */}
        </Route>

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;





