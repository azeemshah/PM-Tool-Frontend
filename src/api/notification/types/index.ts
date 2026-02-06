export interface Notification {
  _id: string;
  recipient: string;
  sender?: string;
  type: string;
  message: string;
  workspace?: string | { _id: string; name: string };
  workItem?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationPayload {
    recipient: string;
    type: string;
    message: string;
    workspace?: string;
    workItem?: string;
}
