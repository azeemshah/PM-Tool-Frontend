import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TaskTable from "@/components/workspace/task/task-table";
import { IssueCreateDialog } from "@/components/issue";
import { useIssueCreateDialog } from "@/hooks/useIssueCreateDialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { IssueType } from "@/api/issue/types";
import { getWorkspaceByIdQueryFn } from "@/lib/api";

export default function Tasks() {
  const workspaceId = useWorkspaceId();
  const dialogState = useIssueCreateDialog();
  const [defaultIssueType, setDefaultIssueType] = useState<IssueType | undefined>();

  // Fetch workspace to get board type
  const { data: workspaceResponse } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspaceByIdQueryFn(workspaceId),
  });

  const workspace = workspaceResponse?.workspace;
  const boardType = (workspace?.boardType || 'kanban') as 'kanban' | 'scrumboard';

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setDefaultIssueType(undefined);
              dialogState.open(workspaceId);
            }}
          >
            <Plus />
            New Issue
          </Button>
          <Button
            onClick={() => {
              setDefaultIssueType("task");
              dialogState.open(workspaceId);
            }}
          >
            <Plus />
            New Task
          </Button>
        </div>
      </div>

      <IssueCreateDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => open ? dialogState.open(workspaceId) : dialogState.close()}
        workspaceId={dialogState.workspaceId || workspaceId}
        defaultType={defaultIssueType}
        boardType={boardType}
      />
      {/* {Task Table} */}
      <div>
        <TaskTable />
      </div>
    </div>
  );
}





