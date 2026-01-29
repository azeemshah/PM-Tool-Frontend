import useAuth from "@/hooks/api/use-auth";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationItem } from "./notification-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

import { RefreshCw } from "lucide-react";

export const NotificationList = () => {
  const { notifications, markRead, markAllRead, removeNotification, isLoading, refetch } = useNotifications();
  const { data: authData } = useAuth();
  const user = authData?.user;

  if (isLoading && notifications.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="w-[380px]">
        <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold leading-none">Notifications</h4>
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => refetch()}
                    title="Refresh"
                >
                    <RefreshCw className="h-3 w-3" />
                </Button>
                {notifications.length > 0 && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => markAllRead()}
                    >
                        <CheckCheck className="mr-1 h-3 w-3" />
                        Mark all read
                    </Button>
                )}
            </div>
        </div>
        <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((notification) => (
                        <NotificationItem 
                            key={notification._id} 
                            notification={notification}
                            onRead={() => markRead(notification._id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                removeNotification(notification._id);
                            }}
                        />
                    ))}
                </div>
            )}
        </ScrollArea>
    </div>
  );
};
