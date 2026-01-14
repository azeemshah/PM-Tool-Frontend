import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import { IssueCreateDialog } from "@/components/issue";
import { useIssueCreateDialog } from "@/hooks/useIssueCreateDialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tasks() {
  const workspaceId = useWorkspaceId();
  const dialogState = useIssueCreateDialog();

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
          <Button onClick={() => dialogState.open(workspaceId, workspaceId)}>
            <Plus />
            New Issue
          </Button>
          <CreateTaskDialog />
        </div>
      </div>
      <IssueCreateDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => open ? dialogState.open(workspaceId, workspaceId) : dialogState.close()}
        projectId={dialogState.projectId || null}
        workspaceId={dialogState.workspaceId || workspaceId}
      />
      {/* {Task Table} */}
      <div>
        <TaskTable />
      </div>
    </div>
  );
}
