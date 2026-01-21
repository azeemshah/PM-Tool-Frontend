import { FC, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2, Zap } from "lucide-react";
import { DataTable } from "./table/table";
import { getColumns } from "./table/columns";
import { DataTableFacetedFilter } from "./table/table-faceted-filter";
import { priorities, statuses } from "./table/data";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import useDebounce from "@/hooks/use-debounce";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText, mapColumnToStatus } from "@/lib/helper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { TaskType } from "@/api/issue/types";
import { useGetKanbanBoards } from "@/api/kanban/hooks/boards/useGetKanbanBoards";
import { useGetKanbanBoardLists } from "@/api/kanban/hooks/lists/useGetKanbanBoardLists";
import { bulkDeleteTasksMutationFn, bulkUpdateTasksMutationFn } from "@/lib/api";
// ---- Define TaskType ----

// ---- Main TaskTable Component ----
const TaskTable: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [filters, setFilters] = useTaskTableFilter();
  const columns = getColumns(); // remove projectId logic

  const { data: kanbanBoards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId =
    kanbanBoards && kanbanBoards.length > 0 ? (kanbanBoards[0] as any)._id : null;
  const { data: boardLists = [] } = useGetKanbanBoardLists(defaultBoardId || null);

  const findColumnIdForStatus = (status: string): string | null => {
    const lists = boardLists || [];
    if (!lists || lists.length === 0) return null;
    const match = (lists as any[]).find((list) => {
      const name = (list && (list as any).name) || "";
      const mapped = mapColumnToStatus(String(name));
      return mapped === status;
    });
    if (!match) return null;
    const id = (match as any)._id || (match as any).id;
    return id ? String(id) : null;
  };

  // Fetch tasks
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["all-tasks", workspaceId, pageSize, pageNumber, filters],
    queryFn: async () => {
      if (!workspaceId) return { tasks: [], pagination: {} };

      const allTasks: TaskType[] = await issueApiService.getTasksByWorkspace(workspaceId);
      console.log("API RAW TASKS:", allTasks);

      // Client-side filtering
      let filtered = allTasks;
      if (filters.keyword) {
        filtered = filtered.filter(
          (t) =>
            (t.title || "").toLowerCase().includes(filters.keyword.toLowerCase()) ||
            (t.taskCode || "").toLowerCase().includes(filters.keyword.toLowerCase())
        );
      }
      if (filters.assigneeId) {
        const selectedAssigneeIds = filters.assigneeId
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        filtered = filtered.filter(
          (t) =>
            t.assignedTo &&
            selectedAssigneeIds.includes(t.assignedTo._id)
        );
      }
      if (filters.issueType) {
        const typeValues = filters.issueType
          .split(",")
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean);

        filtered = filtered.filter((t) =>
          t.type ? typeValues.includes(String(t.type).toLowerCase()) : false
        );
      }
      if (filters.priority) {
        filtered = filtered.filter((t) => (t.priority || "").toLowerCase() === filters.priority.toLowerCase());
      }
      if (filters.status) {
        const statusValues = filters.status
          .split(",")
          .map((v) => v.trim().toLowerCase().replace(/\s+/g, "_"))
          .filter(Boolean);

        filtered = filtered.filter((t) => {
          const taskStatus = (t.status || "").toLowerCase().replace(/\s+/g, "_");
          return statusValues.includes(taskStatus);
        });
      }

      const total = filtered.length;
      const start = (pageNumber - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        tasks: paged,
        pagination: {
          totalCount: total,
          pageSize,
          pageNumber,
          totalPages: Math.ceil(total / pageSize),
          skip: start,
          limit: pageSize,
        },
      };
    },
    enabled: !!workspaceId,
  });

  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteTasksMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      toast({ title: "Success", description: `${selectedTaskIds.length} task(s) deleted successfully`, variant: "success" });
      setSelectedTaskIds([]);
      setIsDeleteAlertOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to delete tasks", variant: "destructive" });
    },
  });

  // Bulk status update
  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateTasksMutationFn,
    onSuccess: async (
      _,
      variables: { ids: string[]; data: { status?: string } }
    ) => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });

      const ids = variables?.ids || [];
      const newStatusLabel = variables?.data?.status;

      if (workspaceId && ids.length > 0 && newStatusLabel) {
        const issueStatus = mapColumnToStatus(newStatusLabel);
        const targetColumnId = findColumnIdForStatus(issueStatus);
        if (targetColumnId) {
          try {
            const kanbanQueryKey = ["all-tasks", "kanban", workspaceId || "unknown"];
            const idSet = new Set(ids.map(String));
            queryClient.setQueryData(kanbanQueryKey, (old: any[] | undefined) => {
              if (!old) return old;
              return old.map((item: any) => {
                if (idSet.has(String(item._id))) {
                  return {
                    ...item,
                    column: targetColumnId,
                    status: newStatusLabel,
                  };
                }
                return item;
              });
            });
            await Promise.all(
              ids.map((id) => issueApiService.moveItemToColumn(id, targetColumnId))
            );
            queryClient.invalidateQueries({ queryKey: ["all-tasks", "kanban"] });
          } catch (error) {
            console.error("Failed to move items to column after bulk update:", error);
            queryClient.invalidateQueries({ queryKey: ["all-tasks", "kanban"] });
          }
        }
      }

      toast({
        title: "Success",
        description: `${selectedTaskIds.length} task(s) updated successfully`,
        variant: "success",
      });
      setSelectedTaskIds([]);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to update tasks", variant: "destructive" });
    },
  });

  const tasks: TaskType[] = data?.tasks || [];
  const totalCount = data?.pagination?.totalCount ?? tasks.length;

  const handlePageChange = (page: number) => {
    setPageNumber(page);
    setSelectedTaskIds([]);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => bulkDeleteMutation.mutate({ ids: selectedTaskIds });
  const handleBulkStatusUpdate = (status: string) => bulkUpdateMutation.mutate({ ids: selectedTaskIds, data: { status } });

  return (
    <div className="w-full relative">
      {selectedTaskIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedTaskIds.length}
          onClearSelection={() => setSelectedTaskIds([])}
          onDelete={handleBulkDelete}
          onStatusUpdate={handleBulkStatusUpdate}
          isLoading={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
        />
      )}

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">
          {(error as any)?.response?.status === 401
            ? "Authentication required — please sign in to view tasks."
            : "Failed to load tasks."}
        </div>
      )}

      <DataTable
        isLoading={isLoading}
        data={tasks as any}
        columns={columns}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pagination={{ totalCount, pageNumber, pageSize }}
        filtersToolbar={
          <DataTableFilterToolbar filters={filters} setFilters={setFilters} isLoading={isLoading} />
        }
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} task(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && <span className="mr-2">Deleting...</span>}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ---- Filter Toolbar ----
const DataTableFilterToolbar: FC<{
  filters: ReturnType<typeof useTaskTableFilter>[0];
  setFilters: ReturnType<typeof useTaskTableFilter>[1];
  isLoading?: boolean;
}> = ({ filters, setFilters, isLoading }) => {
  const { data: memberData } = useGetWorkspaceMembers(useParams<{ workspaceId: string }>().workspaceId!);
  const members = Array.isArray(memberData) ? memberData : memberData?.members || [];

  const assigneesOptions = members.map((member) => {
    const name = member.userId?.name || "Unknown";
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={member.userId?.profilePicture || ""} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const issueTypeOptions = [
    { label: "Epic", value: "epic" },
    { label: "Story", value: "story" },
    { label: "Task", value: "task" },
    { label: "Bug", value: "bug" },
    { label: "Subtask", value: "subtask" },
  ];

  const handleFilterChange = (key: keyof typeof filters, values: string[]) => {
    setFilters({ ...filters, [key]: values.length ? values.join(",") : null });
  };

  // Debounce logic for keyword search (centralized via hook)
  const [searchTerm, setSearchTerm] = useState(filters.keyword || "");

  // Sync local state with parent filter state when it changes externally
  useEffect(() => {
    setSearchTerm(filters.keyword || "");
  }, [filters.keyword]);

  // Use debounced value (300-500ms) to update parent filters
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if ((filters.keyword || "") !== debouncedSearch) {
      setFilters({ ...filters, keyword: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      <Input
        placeholder="Filter tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8 w-full lg:w-[250px]"
      />
      <DataTableFacetedFilter
        title="Status"
        multiSelect
        options={statuses}
        disabled={isLoading}
        selectedValues={filters.status?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("status", values)}
      />
      <DataTableFacetedFilter
        title="Priority"
        multiSelect
        options={priorities}
        disabled={isLoading}
        selectedValues={filters.priority?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("priority", values)}
      />
      <DataTableFacetedFilter
        title="Issue"
        multiSelect={false}
        options={issueTypeOptions}
        disabled={isLoading}
        selectedValues={filters.issueType?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("issueType", values)}
      />
      <DataTableFacetedFilter
        title="Assigned To"
        multiSelect
        options={assigneesOptions}
        disabled={isLoading}
        selectedValues={filters.assigneeId?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("assigneeId", values)}
      />
      {Object.values(filters).some((v) => v) && (
        <Button
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={() => setFilters({ keyword: null, status: null, priority: null, issueType: null, assigneeId: null })}
        >
          Reset <X />
        </Button>
      )}
    </div>
  );
};

// ---- Bulk Actions ----
const BulkActionsBar: FC<{
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: string) => void;
  isLoading?: boolean;
}> = ({ selectedCount, onClearSelection, onDelete, onStatusUpdate, isLoading }) => (
  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
    <div className="flex items-center gap-3">
      <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
        {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
      </span>
    </div>
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <Button size="sm" variant="outline" className="bg-white dark:bg-slate-800" disabled={isLoading}>
          Update Status
        </Button>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[
            { value: "To Do", label: "To Do" },
            { value: "In Progress", label: "In Progress" },
            { value: "In Review", label: "In Review" },
            { value: "Done", label: "Done" }
          ].map((status) => (
            <DropdownMenuCheckboxItem key={status.value} onClick={() => onStatusUpdate(status.value)} disabled={isLoading}>
              {status.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button size="sm" variant="destructive" onClick={onDelete} disabled={isLoading} className="gap-2">
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <Button size="sm" variant="ghost" onClick={onClearSelection} disabled={isLoading}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default TaskTable;
