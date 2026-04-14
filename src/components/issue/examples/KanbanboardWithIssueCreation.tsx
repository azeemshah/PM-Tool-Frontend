/**
 * Example: Kanban with Issue Creation
 * Shows how to integrate IssueCreateDialog into KanbanLayout
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { IssueCreateDialog } from '@/components/issue';
import { useIssueCreateDialog } from '@/hooks/useIssueCreateDialog';
import useWorkspaceId from '@/hooks/use-workspace-id';

/**
 * Example integration into KanbanLayout
 * 
 * This shows how to:
 * 1. Get projectId and workspaceId
 * 2. Manage dialog state
 * 3. Display create button
 * 4. Handle success callback
 */
export function KanbanWithIssueCreation() {
  const workspaceId = useWorkspaceId();
  
  // Manage dialog state
  const dialogState = useIssueCreateDialog();

  // Handle successful creation
  const handleCreateSuccess = () => {
    // Refresh issues, epics, etc.
    // This depends on your query setup
    console.log('Issue created successfully');
    // You might want to:
    // - Refresh your issues list
    // - Navigate to the new issue
    // - Show a success message
  };

  if (!workspaceId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scrum Board</h1>
        
        <Button
          onClick={() => dialogState.open(workspaceId)}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Your existing Kanban content here */}
      <div>
        {/* Board columns, cards, etc. */}
      </div>

      {/* Create Issue Dialog */}
      <IssueCreateDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => {
          if (open) {
            dialogState.open(workspaceId);
          } else {
            dialogState.close();
          }
        }}
        workspaceId={dialogState.workspaceId || workspaceId}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

export default KanbanWithIssueCreation;





