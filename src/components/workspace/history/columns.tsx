import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Activity } from "@/hooks/api/use-history";
import { DataTableColumnHeader } from "../task/table/table-column-header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { ArrowRight, Clock, CheckCircle2, Circle, AlertCircle, Move, Activity as ActivityIcon, Edit, Trash2, MessageSquare } from "lucide-react";

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'create': return <CheckCircle2 className="mr-1 h-3 w-3" />;
    case 'move': return <Move className="mr-1 h-3 w-3" />;
    case 'status_change': return <ActivityIcon className="mr-1 h-3 w-3" />;
    case 'edit': return <Edit className="mr-1 h-3 w-3" />;
    case 'time_logged': return <Clock className="mr-1 h-3 w-3" />;
    case 'comment': return <MessageSquare className="mr-1 h-3 w-3" />;
    case 'delete': return <Trash2 className="mr-1 h-3 w-3" />;
    default: return null;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'create': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'status_change': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'move': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case 'time_logged': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'edit': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'delete': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const getStatusBadgeVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('done') || normalized.includes('complete')) return 'success'; // You might need to define these variants or use custom classes
  if (normalized.includes('progress')) return 'warning';
  if (normalized.includes('review')) return 'secondary';
  return 'default';
};

const getStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('done') || normalized.includes('complete')) return <CheckCircle2 className="mr-1 h-3 w-3" />;
  if (normalized.includes('progress')) return <Clock className="mr-1 h-3 w-3" />;
  if (normalized.includes('review')) return <AlertCircle className="mr-1 h-3 w-3" />;
  return <Circle className="mr-1 h-3 w-3" />;
};

const getStatusStyle = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('done') || normalized.includes('complete')) {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
  }
  if (normalized.includes('progress')) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
  }
  if (normalized.includes('review')) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
  }
  if (normalized.includes('todo') || normalized.includes('to do')) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
};

export const columns: ColumnDef<Activity>[] = [
  {
    accessorKey: "createdAt",
    id: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-muted-foreground">
          {format(date, "MMM dd, yyyy")}
        </span>
      );
    },
  },
  {
    id: "time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-muted-foreground font-mono">
          {format(date, "hh:mm a")}
        </span>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge
          variant="outline"
          className={`capitalize ${getActivityColor(type)}`}
        >
          {getActivityIcon(type)}
          {type.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.taskId?.title || "Unknown Task",
    id: "task",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Task" />
    ),
    cell: ({ row }) => {
      const title = row.original.taskId?.title || "Unknown Task";
      const type = row.original.taskId?.type || "Task";

      return (
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[200px]">{title}</span>
          <span className="text-xs text-muted-foreground lowercase">{type}</span>
        </div>
      );
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      // Determine status based on activity type or current task status
      // If it's a move/status change, show the 'to' status
      // Otherwise show current task status

      let status = "Unknown";
      if (row.original.type === 'move' || row.original.type === 'status_change') {
        status = row.original.to || row.original.taskId?.status || "Unknown";
      } else {
        status = row.original.taskId?.status || "Unknown";
      }

      return (
        <Badge
          variant="outline"
          className={`capitalize whitespace-nowrap ${getStatusStyle(status)}`}
        >
          {getStatusIcon(status)}
          {status}
        </Badge>
      );
    },
  },
  {
    id: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    cell: ({ row }) => {
      const activity = row.original;
      let content: React.ReactNode = "—";

      if (activity.type === 'status_change') {
        content = (
          <span className="flex items-center gap-1 text-sm">
            {activity.from || 'Unknown'} <ArrowRight className="h-3 w-3 text-muted-foreground" /> {activity.to}
          </span>
        );
      } else if (activity.type === 'move') {
        content = (
          <span className="flex items-center gap-1 text-sm">
            Moved to <span className="font-medium">{activity.to}</span>
          </span>
        );
      } else if (activity.type === 'create') {
        content = <span className="text-sm">Created: {activity.details?.title || activity.taskId?.title || 'Task'}</span>;
      } else if (activity.type === 'time_logged') {
        const timeSpent = activity.details?.timeSpent || activity.timeSpentSeconds;
        const h = Math.floor((timeSpent || 0) / 3600);
        const m = Math.floor(((timeSpent || 0) % 3600) / 60);
        const duration = timeSpent ? ` (${h}h ${m}m)` : '';
        content = <span className="text-sm">{(activity.details?.description || 'Logged time') + duration}</span>;
      } else if (activity.type === 'comment') {
        content = <span className="text-sm">Comment: {activity.details?.description || 'No content'}</span>;
      } else if (activity.details && typeof activity.details === 'object') {
        const keys = Object.keys(activity.details).filter(k => k !== 'title' && k !== 'description' && k !== 'status' && k !== 'columnName');
        if (keys.length > 0) content = <span className="text-sm">Updated: {keys.join(', ')}</span>;
        else if (activity.details.columnName) content = <span className="text-sm">Column: {activity.details.columnName}</span>;
      }

      return (
        <div className="max-w-[300px] truncate" title={typeof content === 'string' ? content : undefined}>
          {content}
        </div>
      );
    },
  },
  {
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = row.original.userId;
      if (!user) return <span className="text-muted-foreground">-</span>;

      const name = user.name || "Unknown";
      const initials = getAvatarFallbackText(name);
      const color = getAvatarColor(initials);

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar} alt={name} />
            <AvatarFallback className={`${color} text-[10px]`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate max-w-[120px]">{name}</span>
        </div>
      );
    },
  },
];
