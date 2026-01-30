import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react";

import "./index.css";
import App from "./App.tsx";
import QueryProvider from "./context/query-provider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { NotificationProvider } from "./contexts/notification-context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <NuqsAdapter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <NotificationProvider>
            <App />
            <Toaster />
          </NotificationProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryProvider>
  </StrictMode>
);





