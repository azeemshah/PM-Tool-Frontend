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
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { bulkDeleteTasksMutationFn } from "@/lib/api";
import EditTaskDialog from "./edit-task-dialog";

// ---- Define TaskType ----

// ---- Main TaskTable Component ----
const TaskTable: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskType | null>(null);

  const [filters, setFilters] = useTaskTableFilter();
  useEffect(() => {
  // Whenever keyword changes, reset to first page
  setPageNumber(1);
}, [filters.keyword]);

  const columns = getColumns(); // remove projectId logic

  const { data: kanbanBoards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId =
    kanbanBoards && kanbanBoards.length > 0 ? (kanbanBoards[0] as any)._id : null;
  const { data: boardLists = [] } = useGetKanbanBoardLists(defaultBoardId || null);
  const { statuses: dynamicStatuses } = useGetWorkspaceStatuses(workspaceId!);

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
  queryKey: [
    "all-tasks",
    workspaceId,
    pageNumber,
    pageSize,
    filters,
  ],
  queryFn: async () => {
    if (!workspaceId) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: pageSize, totalPages: 0 },
      };
    }

    return issueApiService.getTasksByWorkspace(workspaceId, {
      page: pageNumber,
      limit: pageSize,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      type: filters.issueType || undefined,
      reporter: filters.assigneeId || undefined,
      keyword: filters.keyword || undefined,
    });
  },
  enabled: !!workspaceId,
  placeholderData: (previousData) => previousData,

});


  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteTasksMutationFn,
    onSuccess: () => {
      setIsDeleteAlertOpen(false);
      setSelectedTaskIds([]);

      setTimeout(() => {
        // Manual cleanup to prevent UI freeze
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";

        queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
        queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
        toast({ title: "Success", description: "Tasks deleted successfully", variant: "success" });
      }, 300);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to delete tasks", variant: "destructive" });
    },
  });



const tasks: TaskType[] = data?.data || [];
const totalCount = data?.meta?.total ?? 0;


  const handlePageChange = (page: number) => {
    setPageNumber(page);
    setSelectedTaskIds([]);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => bulkDeleteMutation.mutate({ ids: selectedTaskIds });

  return (
    <div className="w-full relative">
      {selectedTaskIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedTaskIds.length}
          onClearSelection={() => setSelectedTaskIds([])}
          onDelete={handleBulkDelete}
          isLoading={bulkDeleteMutation.isPending}
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
        onRowClick={(row: any) => {
          setEditTarget(row as TaskType);
          setOpenEditDialog(true);
        }}
        onRowSelectionChange={(selectedRows) => {
          setSelectedTaskIds(selectedRows.map(row => (row as any)._id));
        }}
        resetRowSelection={selectedTaskIds.length === 0}
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

      {editTarget && (
        <EditTaskDialog
          task={editTarget}
          isOpen={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
        />
      )}
    </div>
  );
};

// ---- Filter Toolbar ----
const DataTableFilterToolbar: FC<{
  filters: ReturnType<typeof useTaskTableFilter>[0];
  setFilters: ReturnType<typeof useTaskTableFilter>[1];
  isLoading?: boolean;
}> = ({ filters, setFilters, isLoading }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: memberData } = useGetWorkspaceMembers(workspaceId!);
  const { statuses: dynamicStatuses } = useGetWorkspaceStatuses(workspaceId!);
  const members = Array.isArray(memberData) ? memberData : memberData?.members || [];

  const assigneesOptions = members.map((member) => {
    if (!member) return { label: "Unknown", value: "" };
    
    // Handle both new (user object) and old (userId object) structures
    const userObj = member.user || member.userId;
    
    // Safety check if userObj is just an ID string or null
    if (!userObj || typeof userObj === 'string') {
         return { label: "Unknown", value: typeof userObj === 'string' ? userObj : "" };
    }

    const name = userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : "Unknown");
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={userObj.profilePicture || ""} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: userObj._id || "",
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
        options={dynamicStatuses}
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
  isLoading?: boolean;
}> = ({ selectedCount, onClearSelection, onDelete, isLoading }) => (
  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
    <div className="flex items-center gap-3">
      <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
        {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
      </span>
    </div>
    <div className="flex items-center gap-2">
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
