import { useState } from "react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useGetHistory, ActivityType } from "@/hooks/api/use-history";
import { DataTable } from "@/components/workspace/task/table/table";
import { columns } from "@/components/workspace/history/columns";
import { DataTableFacetedFilter } from "@/components/workspace/task/table/table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, CheckCircle2, Move, Clock, Edit, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function History() {
  const workspaceId = useWorkspaceId();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useGetHistory({
    projectId: workspaceId,
    type: type.length === 1 ? (type[0] as ActivityType) : undefined, // API currently supports single type or all. If we want multi-select filter support, backend needs update. For now, let's treat single selection or just pass the first one if multiple selected (or we could improve this later).
    // Actually, looking at the previous code, it supported 'all' or a specific type. 
    // If the user selects multiple types in the faceted filter, we might need to handle client-side filtering or update the API.
    // For now, let's assume the API might only support one type filter or we stick to the previous behavior.
    // However, FacetedFilter returns an array.
    // Let's pass the first selected type if any, otherwise undefined (all).
    from: dateRange?.from?.toISOString(),
    to: dateRange?.to?.toISOString(),
    page,
    limit: pageSize,
    sortOrder,
  });

  // Derived effective type for API
  // If multiple selected, we might want to filter client side or just pass one. 
  // Given the current API limitation (likely), let's just use the first one if present.
  const effectiveType = type.length > 0 ? (type[0] as ActivityType) : undefined;

  const activityTypes = [
    { value: "create", label: "Create", icon: CheckCircle2 },
    { value: "move", label: "Move", icon: Move },
    { value: "edit", label: "Edit", icon: Edit },
    { value: "time_logged", label: "Time Logged", icon: Clock },
    { value: "comment", label: "Comment", icon: MessageSquare },
    { value: "delete", label: "Delete", icon: Trash2 },
  ];

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity History</h2>
          <p className="text-muted-foreground">
            User activity timeline for this workspace
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          pagination={{
            totalCount: data?.total || 0,
            pageNumber: page,
            pageSize: pageSize,
          }}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1); // Reset to first page when page size changes
          }}
          filtersToolbar={
            <div className="flex flex-1 items-center space-x-2">
              <DataTableFacetedFilter
                title="Event Type"
                options={activityTypes}
                selectedValues={type}
                onFilterChange={setType}
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "h-8 border-dashed justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {(type.length > 0 || dateRange) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setType([]);
                    setDateRange(undefined);
                  }}
                  className="h-8 px-2 lg:px-3"
                >
                  Reset
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
