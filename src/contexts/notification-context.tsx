import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import useAuth from "@/hooks/api/use-auth";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/api/notification/services/notificationApiService";
import { Notification } from "@/api/notification/types";
import { baseURL } from "@/lib/base-url";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
        setNotifications([]);
        return;
    }
    
    setIsLoading(true);
    try {
        const data = await getNotifications(user._id);
        // Sort by newest first
        const sorted = Array.isArray(data) ? data.sort((a: Notification, b: Notification) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) : [];
        setNotifications(sorted);
    } catch (err) {
        console.error('NotificationContext: fetch error', err);
    } finally {
        setIsLoading(false);
    }
  }, [user?._id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket connection
  useEffect(() => {
    if (!user?._id || !baseURL) return;

    // Connect to the 'notifications' namespace
    // Assuming baseURL is like http://localhost:5000/api/v1
    // We want http://localhost:5000/notifications
    let socketUrl = baseURL;
    try {
        const url = new URL(baseURL);
        socketUrl = `${url.origin}/notifications`;
    } catch (e) {
        console.warn("Invalid baseURL for socket connection, falling back to /notifications", e);
        socketUrl = '/notifications';
    }

    const newSocket = io(socketUrl, {
      query: { userId: user._id },
      transports: ['websocket'], // Force WebSocket to avoid polling issues
    });

    console.log('NotificationContext: Connecting to socket', socketUrl, user._id);

    newSocket.on('connect', () => {
      console.log('NotificationContext: Connected to notification socket', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('NotificationContext: Connection error', err);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('NotificationContext: New notification received', notification);
      setNotifications((prev) => [notification, ...prev]);
      
      toast({
        title: "New Notification",
        description: notification.message,
        duration: 5000,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
    });

    setSocket(newSocket);

    return () => {
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
