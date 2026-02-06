import { Notification } from "@/api/notification/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
    MessageSquare, 
    CheckSquare, 
    FileEdit, 
    Trash2, 
    Bell, 
    UserPlus, 
    AlertCircle,
    Paperclip 
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const NotificationItem = ({ notification, onRead, onDelete }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'COMMENT_ADDED':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'TASK_ASSIGNED':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'STATUS_CHANGED':
        return <CheckSquare className="h-4 w-4 text-yellow-500" />;
      case 'WORK_ITEM_CREATED':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case 'WORK_ITEM_UPDATED':
        return <FileEdit className="h-4 w-4 text-orange-500" />;
      case 'WORK_ITEM_DELETED':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'ATTACHMENT_ADDED':
        return <Paperclip className="h-4 w-4 text-cyan-500" />;
      case 'MEMBER_ADDED':
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case 'WORKSPACE_UPDATED':
      case 'WORKSPACE_DELETED':
        return <AlertCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div 
        className={cn(
            "flex items-start gap-3 p-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer relative group",
            !notification.isRead && "bg-muted/20"
        )}
        onClick={onRead}
    >
        <div className="mt-1 shrink-0">
            {getIcon()}
        </div>
        <div className="flex-1 space-y-1">
            <p className={cn("leading-none", !notification.isRead && "font-medium")}>
                {notification.message}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {typeof notification.workspace === 'object' && notification.workspace.name && (
                    <>
                        <span className="font-medium">{notification.workspace.name}</span>
                        <span>•</span>
                    </>
                )}
                <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
            </div>
        </div>
        <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 hover:bg-background/80 rounded-full transition-opacity"
            title="Delete"
        >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
        {!notification.isRead && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
        )}
    </div>
  );
};
