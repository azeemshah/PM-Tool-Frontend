import API from "@/lib/axios-client";
import { Notification } from "../types";

export const getNotifications = async (userId: string) => {
  const response = await API.get(`/pm-kanban/notifications/user/${userId}`);
  return response.data;
};

export const markAsRead = async (notificationId: string) => {
  const response = await API.patch(`/pm-kanban/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (userId: string) => {
  const response = await API.patch(`/pm-kanban/notifications/user/${userId}/read-all`);
  return response.data;
};

export const deleteAllNotifications = async (userId: string) => {
  const response = await API.delete(`/pm-kanban/notifications/user/${userId}/clear-all`);
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await API.delete(`/pm-kanban/notifications/${notificationId}`);
  return response.data;
};
