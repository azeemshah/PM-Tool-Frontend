import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { TaskType } from "@/api/issue/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { toast } from "@/hooks/use-toast";
import EditTaskDialog from "../edit-task-dialog"; // Import the Edit Dialog

interface DataTableRowActionsProps {
  row: Row<TaskType>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false); // State for edit dialog

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate, isPending } = useMutation({
    mutationFn: issueApiService.deleteIssue,
  });

  const task = row.original;
  const taskId = task._id as string;
  const taskCode = task.taskCode;

  const handleConfirm = () => {
    mutate(taskId, {
      onSuccess: () => {
        setOpenDialog(false);

        setTimeout(() => {
          // Manual cleanup to prevent UI freeze
          document.body.style.pointerEvents = "";
          document.body.style.overflow = "";

          queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
          queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
          queryClient.invalidateQueries({ queryKey: ["gantt-data", workspaceId] });
          toast({ title: "Success", description: `Task ${taskCode} deleted successfully`, variant: "success" });
        }, 300);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || error?.message || "Failed to delete task";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Edit Task Option */}
          {/* <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOpenEditDialog(true);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit Issue
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />

          {/* Delete Task Option */}
          <DropdownMenuItem
            className="!text-destructive cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            onSelect={() => {
              setTimeout(() => {
                setOpenDialog(true);
              }, 100);
            }}
          >
            Delete Issue
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Task Dialog */}
      <EditTaskDialog task={task} isOpen={openEditDialog} onClose={() => setOpenEditDialog(false)}
      />

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete ${taskCode}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}




