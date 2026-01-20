import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { useGetWorkspaceSprints } from '@/api/scrumboard/hooks/sprints/useGetWorkspaceSprints';
import { SprintApiService } from '@/api/scrumboard/services/SprintApiService';
import { toast } from '@/hooks/use-toast';
import { KanbanCard, KanbanBoard, KanbanList } from '@/api/kanban/types';
import WorkItemCard from './WorkItemCard';
import WorkItemCreationDialog from './WorkItemCreationDialog';

interface BacklogPanelProps {
  workspaceId: string;
}

const BacklogPanel: React.FC<BacklogPanelProps> = ({ workspaceId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  // Get boards for this workspace
  const { data: boards = [] } = useGetKanbanBoards(workspaceId);

  // Use the first board as the default board for scrumboard
  const defaultBoard = boards.length > 0 ? boards[0] : null;

  // Get lists for the default board
  const { data: lists = [] } = useGetKanbanBoardLists(defaultBoard?._id || null);

  // Find or use the first list as backlog
  const backlogList = lists.find((list: KanbanList) =>
    list.name.toLowerCase().includes('backlog')
  ) || lists[0];

  // Get sprints for "Move to Sprint" functionality
  const { data: sprints = [] } = useGetWorkspaceSprints(workspaceId);
  const activeSprints = sprints.filter(s => s.status !== 'COMPLETED');

  // Mutation to add items to sprint
  const addToSprintMutation = useMutation({
    mutationFn: ({ sprintId, itemIds }: { sprintId: string; itemIds: string[] }) =>
      SprintApiService.addWorkItemsToSprint(sprintId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sprints'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-items'] });
      // Also invalidate board cards just in case
      queryClient.invalidateQueries({ queryKey: ['board-cards'] });

      toast({
        title: 'Success',
        description: 'Work item added to sprint successfully',
      });
    },
    onError: (error: any) => {
      console.error('Failed to add to sprint:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to add work item to sprint',
        variant: 'destructive',
      });
    },
  });

  // Get all work items using issueApiService to match All Tasks page
  const { data: allWorkItems = [], isLoading } = useQuery({
    queryKey: ['workspace-items', workspaceId],
    queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  // Filter work items that are in BACKLOG status and not assigned to any sprint
  // Note: Check case-insensitive for status
  const backlogItems = allWorkItems.filter((item: any) =>
    (item.status?.toLowerCase() === 'backlog' || !item.status)
  );

  // Filter by search term
  const filteredItems = backlogItems.filter((item: any) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading backlog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backlog</h1>
            <p className="text-gray-600">Plan and prioritize your work items</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Work Item
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search work items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              📋
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No work items found' : 'Backlog is empty'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Create work items to start planning your sprints'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Work Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredItems.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredItems.filter((item: any) => item.priority?.toLowerCase() === 'high').length}
                    </div>
                    <div className="text-sm text-gray-600">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {filteredItems.filter((item: any) => item.priority?.toLowerCase() === 'medium').length}
                    </div>
                    <div className="text-sm text-gray-600">Medium Priority</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Ready for Sprint Planning
                </Badge>
              </div>
            </Card>

            {/* Work Items List */}
            <div className="space-y-3">
              {filteredItems.map((item: any) => (
                <div key={item._id} className="relative group">
                  <WorkItemCard card={item} />

                  {/* Actions Dropdown */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white">
                          <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Move to Sprint</DropdownMenuLabel>
                        {activeSprints.length > 0 ? (
                          activeSprints.map(sprint => (
                            <DropdownMenuItem
                              key={sprint._id}
                              onClick={() => addToSprintMutation.mutate({ sprintId: sprint._id, itemIds: [item._id] })}
                              className="cursor-pointer"
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              <span className="truncate">{sprint.name}</span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled>
                            <span className="text-muted-foreground">No active sprints</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                  <p>No work items found in backlog</p>
                  <Button
                    variant="link"
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-2"
                  >
                    Create your first item
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Work Item Creation Dialog */}
      <WorkItemCreationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        workspaceId={workspaceId}
        boardId={defaultBoard?._id || ''}
        listId={backlogList?._id || ''}
      />
    </div>
  );
};

export default BacklogPanel;