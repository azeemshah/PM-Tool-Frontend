import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowUpDown, Clock, Zap } from "lucide-react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { IssueCreateDialog } from "@/components/issue";
import { useIssueCreateDialog } from "@/hooks/useIssueCreateDialog";
import API from "@/lib/axios-client";
import { getWorkspaceByIdQueryFn } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Badge,
} from "@/components/ui/badge";
import TableSkeleton from "@/components/skeleton-loaders/table-skeleton";

interface Project {
  _id: string;
  name: string;
}

interface Issue {
  _id: string;
  key: string;
  title: string;
  description?: string;
  type: "epic" | "story" | "task" | "bug" | "subtask";
  priority?: string;
  status?: string;
  assignee?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  projectId?: string;
  projectName?: string;
  epicId?: string;
  createdAt?: string;
  updatedAt?: string;
  originalEstimate?: number;
  remainingEstimate?: number;
  timeSpent?: number;
  storyPoints?: number | null;
}

const minutesToHours = (minutes?: number): string => {
  if (!minutes) return '-';
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${Math.floor(hours)}h` : `${hours.toFixed(1)}h`;
};

// No local mock fallback; prefer live backend issues

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "backlog":
      return "bg-gray-100 text-gray-800";
    case "todo":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
    case "in-progress":
      return "bg-yellow-100 text-yellow-800";
    case "in_review":
    case "in-review":
      return "bg-purple-100 text-purple-800";
    case "done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-orange-100 text-orange-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "epic":
      return "bg-purple-100 text-purple-800";
    case "story":
      return "bg-blue-100 text-blue-800";
    case "task":
      return "bg-green-100 text-green-800";
    case "bug":
      return "bg-red-100 text-red-800";
    case "subtask":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Issues() {
  const workspaceId = useWorkspaceId();
  const dialogState = useIssueCreateDialog();
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"key" | "title" | "status" | "priority">("key");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch workspace to get board type
  const { data: workspaceResponse } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspaceByIdQueryFn(workspaceId),
  });

  const workspace = workspaceResponse?.workspace;
  const boardType = (workspace?.boardType || 'kanban') as 'kanban' | 'scrumboard';

  // Fetch projects in the workspace
  const { data: projectsData, error: projectsError } = useQuery({
    queryKey: ["workspace-projects", workspaceId],
    queryFn: async () => {
      try {
        const response = await API.get(`/projects`, { 
          params: { workspaceId } 
        });
        return (response.data?.data || response.data || []) as Project[];
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        // If authentication required, rethrow so UI can show auth error
        if (error?.response?.status === 401) throw error;
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch issues from all projects
  const { data: issuesData, isLoading, isError, error } = useQuery({
    queryKey: ["workspace-issues", workspaceId, projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) {
        return [];
      }

      try {
        // Fetch issues from all projects
        const issuePromises = projectsData.map((project) =>
          API.get(`/issues/project/${project._id}`)
            .then((res) => {
              const projectIssues = (res.data?.data || res.data || []) as Issue[];
              // Add project name to each issue
              return projectIssues.map((issue) => ({
                ...issue,
                projectName: project.name,
              }));
            })
            .catch(() => [])
        );

        const allIssuesArrays = await Promise.all(issuePromises);
        const allIssues = allIssuesArrays.flat();
        return allIssues as Issue[];
      } catch (error: any) {
        console.error("Error fetching issues:", error);
        if (error?.response?.status === 401) throw error;
        return [];
      }
    },
    enabled: !!projectsData && projectsData.length > 0,
    staleTime: 0,
  });

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
      // prefer live data from backend; if empty, result will be empty array
      let result = issuesData || [];

    // Filter by keyword
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.key.toLowerCase().includes(lowerKeyword) ||
          issue.title.toLowerCase().includes(lowerKeyword) ||
          issue.description?.toLowerCase().includes(lowerKeyword)
      );
    }

    // Sort
    const sorted = [...result].sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [issuesData, keyword, sortBy, sortOrder]);

  const handleSort = (field: "key" | "title" | "status" | "priority") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Issues</h2>
          <p className="text-muted-foreground">
            All issues and work items in your workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => dialogState.open(workspaceId)}>
            <Plus />
            New Issue
          </Button>
        </div>
      </div>

      <IssueCreateDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => open ? dialogState.open(workspaceId) : dialogState.close()}
        workspaceId={dialogState.workspaceId || workspaceId}
        boardType={boardType}
      />

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search issues by key, title, or description..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-8 w-full md:w-[300px]"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          {isLoading ? (
            <TableSkeleton columns={7} rows={10} />
          ) : isError || projectsError ? (
            <div className="p-6 text-center text-sm text-red-600">
                  {((error as any)?.response?.status === 401 || (projectsError as any)?.response?.status === 401) ? (
                    "Authentication required — please sign in to view issues."
                  ) : (
                    "Failed to fetch issues. Please ensure the backend is running."
                  )}
                  {error && (error as any).message ? <div className="mt-2 text-xs text-muted-foreground">{String((error as any).message)}</div> : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("key")}
                  >
                    <div className="flex items-center gap-2">
                      Key
                      {sortBy === "key" && <ArrowUpDown size={14} />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      {sortBy === "title" && <ArrowUpDown size={14} />}
                    </div>
                  </TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortBy === "status" && <ArrowUpDown size={14} />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-2">
                      Priority
                      {sortBy === "priority" && <ArrowUpDown size={14} />}
                    </div>
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Time & Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedIssues && filteredAndSortedIssues.length > 0 ? (
                  filteredAndSortedIssues.map((issue) => (
                    <TableRow key={issue._id} className="hover:bg-gray-50 cursor-pointer">
                      <TableCell className="font-medium text-blue-600">{issue.key}</TableCell>
                      <TableCell className="max-w-sm truncate">{issue.title}</TableCell>
                      <TableCell className="text-sm text-gray-600">{issue.projectName || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(issue.type)}>
                          {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status?.replace(/_/g, " ") || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {issue.priority ? (
                          <Badge className={getPriorityColor(issue.priority)}>
                            {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {issue.assignee?.name || (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          {issue.storyPoints && (
                            <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                              <Zap size={12} />
                              {issue.storyPoints}
                            </div>
                          )}
                          {issue.timeSpent !== undefined && issue.timeSpent > 0 && (
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              <Clock size={12} />
                              {minutesToHours(issue.timeSpent)}
                            </div>
                          )}
                          {!issue.storyPoints && (!issue.timeSpent || issue.timeSpent === 0) && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {keyword ? "No issues matching your search" : "No issues found in this workspace"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {filteredAndSortedIssues.length > 0 && (
          <div className="text-sm text-gray-600 flex justify-between items-center">
            <span>Showing {filteredAndSortedIssues.length} issue(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}





