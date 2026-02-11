import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import useAuth from "@/hooks/api/use-auth";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from "@/api/notification/services/notificationApiService";
import { Notification } from "@/api/notification/types";
import { baseURL } from "@/lib/base-url";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children, workspaceId }: { children: ReactNode; workspaceId?: string }) => {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use a ref to keep track of the current workspaceId without triggering socket reconnection
  const workspaceIdRef = React.useRef(workspaceId);

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getNotifications(user._id);
      // Sort by newest first
      let sorted = Array.isArray(data) ? data.sort((a: Notification, b: Notification) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ) : [];

      if (workspaceId) {
        sorted = sorted.filter(n => {
          const wsId = typeof n.workspace === 'object' ? n.workspace._id : n.workspace;
          return !wsId || wsId === workspaceId;
        });
      }

      setNotifications(sorted);
    } catch (err) {
      console.error('NotificationContext: fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, workspaceId]);


  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket connection
  useEffect(() => {
    if (!user?._id || !baseURL) return;

    // Construct socket URL
    // We need the base origin (e.g., http://localhost:5000) and append the namespace
    let socketUrl = import.meta.env.VITE_SOCKET_URL;
    
    if (socketUrl) {
        // Remove trailing slash if present
        socketUrl = socketUrl.replace(/\/$/, '');
        socketUrl = `${socketUrl}/notifications`;
    } else {
        try {
            const url = new URL(baseURL);
            // If baseURL has a path (like /api/v1), we want just the origin
            socketUrl = `${url.origin}/notifications`;
        } catch (e) {
            console.warn("Invalid baseURL for socket connection, falling back to /notifications", e);
            socketUrl = '/notifications';
        }
    }

    console.log('NotificationContext: Connecting to socket', socketUrl, 'with userId:', user._id);

    const newSocket = io(socketUrl, {
      query: { userId: String(user._id) }, // Ensure string
      transports: ['websocket', 'polling'], // Allow polling fallback
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      forceNew: false, // Don't force new connection unnecessarily
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('NotificationContext: Connected to notification socket', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('NotificationContext: Connection error', err);
      // Only show error toast if it persists (optional)
      // toast({ variant: "destructive", title: "Connection Error", description: err.message });
    });

    newSocket.on('welcome', (data) => {
      console.log('NotificationContext: Received welcome message', data);
    });

    newSocket.on('connect_error', (err) => {
      console.error('NotificationContext: Connection error', err.message, err);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('NotificationContext: New notification received', notification);
      
      // Show toast immediately for feedback
      toast({
          title: "New Notification",
          description: notification.message,
      });

      setNotifications((prev) => {
        // Check if notification already exists to prevent duplicates
        if (prev.some(n => n._id === notification._id)) {
            return prev;
        }
        return [notification, ...prev];
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from notification socket:', reason);
    });

    setSocket(newSocket);

    return () => {
      console.log('NotificationContext: Cleaning up socket');
      newSocket.disconnect();
    };
  }, [user?._id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      await markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Revert if needed, but for read status it's usually fine
    }
  };

  const markAllRead = async () => {
    if (!user?._id) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markAllAsRead(user._id);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?._id) return;
    try {
      setNotifications([]);
      await deleteAllNotifications(user._id);
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Failed to clear all notifications", error);
      // Refetch to restore state in case of error
      fetchNotifications();
    }
  };

  const removeNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== id));
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      markRead,
      markAllRead,
      clearAllNotifications,
      removeNotification,
      refetch: fetchNotifications,
      socket
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
