import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";

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
} from "@/lib/helper";
import { priorities, statuses } from "./data";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const getColumns = (projectId?: string): ColumnDef<TaskType>[] => {
  const columns: ColumnDef<TaskType>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
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
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-wrap space-x-2">
            <Badge variant="outline" className="capitalize shrink-0 h-[25px]">
              {row.original.taskCode}
            </Badge>
            <span className="block lg:max-w-[220px] max-w-[200px] font-medium">
              {row.original.title}
            </span>
          </div>
        );
      },
    },
    // Issue Type column (Epic / Story / Task / Bug / Subtask)
    {
      accessorFn: (row) => (row as any).type || (row as any).issueType || null,
      id: "issueType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue" />
      ),
      cell: ({ row }) => {
        const t = (row.original as any).type || (row.original as any).issueType || null;
        if (!t) return null;
        // show capitalized label
        return (
          <span className="capitalize text-sm font-medium">{String(t)}</span>
        );
      },
    },
    ...(projectId
      ? [] // If projectId exists, exclude the "Project" column
      : [
          {
            accessorKey: "project",
            header: ({ column }: { column: Column<TaskType, unknown> }) => (
              <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }: { row: Row<TaskType> }) => {
              const project = row.original.project;

              if (!project) {
                return null;
              }

              return (
                <div className="flex items-center gap-1">
                  <span className="rounded-full border">{project.emoji}</span>
                  <span className="block capitalize truncate w-[100px] text-ellipsis">
                    {project.name}
                  </span>
                </div>
              );
            },
          },
        ]),
    {
      accessorKey: "assignedTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned To" />
      ),
      cell: ({ row }) => {
        // Try to get assignee first, fallback to reporter
        const assignee = row.original.assignedTo || row.original.reporter || null;
        const name = assignee?.name || "";

        if (!name) {
          return <span className="text-sm text-muted-foreground">Unassigned</span>;
        }

        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignee?.profilePicture || ""} alt={name} />
              <AvatarFallback className={avatarColor}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="block text-ellipsis w-[100px] truncate">
              {assignee?.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        
        if (!dueDate) {
          return <span className="text-sm text-muted-foreground">No due date</span>;
        }

        try {
          // Handle both string and Date object formats
          const dateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
          const formattedDate = format(dateObj, "PPP");
          return (
            <span className="lg:max-w-[100px] text-sm">
              {formattedDate}
            </span>
          );
        } catch {
          return <span className="text-sm text-muted-foreground">Invalid date</span>;
        }
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const rawStatus = row.getValue("status");
        const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toUpperCase() : rawStatus;
        const status = statuses.find(
          (status) => status.value === normalizedStatus
        );

        if (!status) {
          return <span className="text-sm text-muted-foreground">Unknown status</span>;
        }

        const statusKey = formatStatusToEnum(
          status.value
        ) as TaskStatusEnumType;
        const Icon = status.icon;

        if (!Icon) {
          return <span className="text-sm text-muted-foreground">Unknown status</span>;
        }

        return (
          <div className="flex lg:w-[120px] items-center">
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{status.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const rawPriority = row.getValue("priority");
        const normalizedPriority = typeof rawPriority === "string" ? rawPriority.toUpperCase() : rawPriority;
        const priority = priorities.find(
          (priority) => priority.value === normalizedPriority
        );

        if (!priority) {
          return <span className="text-sm text-muted-foreground">No priority</span>;
        }

        const statusKey = formatStatusToEnum(
          priority.value
        ) as TaskPriorityEnumType;
        const Icon = priority.icon;

        if (!Icon) {
          return <span className="text-sm text-muted-foreground">No priority</span>;
        }

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
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <>
            <DataTableRowActions row={row} />
          </>
        );
      },
    },
  ];

  return columns;
};
