import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { format } from "date-fns";
import { Flag, Clock, Zap, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "./table-column-header";
import { DataTableRowActions } from "./table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import {
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText,
  formatDuration,
  transformStatusEnum,
  getProfileImageUrl,
} from "@/lib/helper";
import { priorities, issueTypes, getStatusIcon } from "./data";
import { getGanttStatusColor } from "@/components/gantt-chart/utils/colorMaps";
import { TaskType } from "@/api/issue/types";
import { TableTimer } from "./table-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const getColumns = (onBulkDeleteClick?: () => void): ColumnDef<TaskType>[] => {
  const columns: ColumnDef<TaskType>[] = [
    // Selection Checkbox
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Title Column
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap space-x-2">
          <span className="block lg:max-w-[220px] max-w-[200px] font-medium">
            {row.original.title}
          </span>
        </div>
      ),
    },

    // Issue Type Column
    {
      accessorFn: (row) => (row as any).type || (row as any).issueType || null,
      id: "issueType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Issue" />,
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        const status = row.original.status;
        const isOverdue = (() => {
          if (!dueDate) return false;
          const due = new Date(dueDate);
          const now = new Date();
          const statusEnum = formatStatusToEnum(String(status || ''));
          return due < now && statusEnum !== 'DONE';
        })();

        const rawType = (row.original as any).type || (row.original as any).issueType || null;
        const typeValue = String(rawType || "No type");
        const normalizedType = typeValue.toLowerCase();
        const issueType = issueTypes.find(
          (t) => t.value.toLowerCase() === normalizedType
        );

        return (
          <div className="flex items-center gap-2">
            {/* Issue Type Badge */}
            {(() => {
              if (!rawType) {
                return <span className="text-sm text-muted-foreground">No type</span>;
              }

              if (!issueType) {
                return <span className="capitalize text-sm font-medium">{typeValue}</span>;
              }

              const Icon = issueType.icon;
              return (
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border-0 ${issueType.className}`}
                >
                  <Icon className="h-4 w-4 text-inherit" />
                  <span className="capitalize">{issueType.label}</span>
                </Badge>
              );
            })()}

            {isOverdue && (
              <Badge
                variant="outline"
                className="flex items-center px-2 py-1 text-xs font-medium rounded-md shadow-sm border-0 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
              >
                <Flag className="h-4 w-4 text-inherit" />
              </Badge>
            )}
          </div>
        );
      },
    },

    // Assigned To Column
    {
      accessorKey: "assignedTo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
      cell: ({ row }) => {
        const assignee = row.original.assignedTo || row.original.reporter || null;
        const name = assignee?.name || "";

        if (!name) return <span className="text-sm text-muted-foreground">Unassigned</span>;

        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={getProfileImageUrl(assignee?.profilePicture) || ""} alt={name} />
              <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
            </Avatar>
            <span className="block text-ellipsis w-[100px] truncate">{assignee?.name}</span>
          </div>
        );
      },
    },

    // Due Date Column
    {
      accessorKey: "dueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        if (!dueDate) return <span className="text-sm text-muted-foreground">No due date</span>;

        try {
          const dateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
          const formattedDate = format(dateObj, "PPP");
          return <span className="lg:max-w-[100px] text-sm">{formattedDate}</span>;
        } catch {
          return <span className="text-sm text-muted-foreground">Invalid date</span>;
        }
      },
    },

    // Status Column
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const rawStatus = row.getValue("status");
        const statusValue = typeof rawStatus === "string" ? rawStatus : String(rawStatus);

        const colors = getGanttStatusColor(statusValue);
        const Icon = getStatusIcon(statusValue);

        return (
          <div className="flex lg:w-[120px] items-center">
            <Badge
              variant="outline"
              className={`flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 ${colors.bg} ${colors.text}`}
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{transformStatusEnum(statusValue)}</span>
            </Badge>
          </div>
        );
      },
    },

    // Priority Column
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => {
        const rawPriority = row.getValue("priority");
        const priorityValue = typeof rawPriority === "string" ? rawPriority : String(rawPriority);
        const priority = priorities.find((p) => p.value.toLowerCase() === priorityValue.toLowerCase());

        if (!priority) return <span className="text-sm text-muted-foreground">No priority</span>;

        const statusKey = formatStatusToEnum(priority.value) as TaskPriorityEnumType;
        const Icon = priority.icon;

        return (
          <div className="flex items-center">
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{priority.label}</span>
            </Badge>
          </div>
        );
      },
    },

    // Story Points Column
    {
      accessorKey: "storyPoints",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Story Points" />,
      cell: ({ row }) => {
        const storyPoints = row.original.storyPoints;
        if (!storyPoints || storyPoints <= 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <Badge className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-sm border-0 bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
            <Zap className="h-3 w-3" />
            <span>{storyPoints}</span>
          </Badge>
        );
      },
    },

    // Time Logged Column
    {
      accessorKey: "timeSpent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time Logged" />,
      cell: ({ row }) => {
        return (
          <TableTimer
            issueId={row.original._id}
            defaultTimeSpent={row.original.timeSpent}
          />
        );
      },
    },

    // Actions Column
    {
      id: "actions",
      header: ({ table }) => (
        <div className="flex justify-end">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onBulkDeleteClick}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Issues</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ];

  return columns;
};




