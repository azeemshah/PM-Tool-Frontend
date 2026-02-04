import React, { useState } from "react";
import { useWorkItemTags } from "@/hooks/api/use-work-item-tags";
import {
  WorkItemTags,
  TagManager,
  TagFilterPanel,
  TagStatistics,
} from "@/components/issue/tags";
import { Button } from "@/components/ui/button";

/**
 * Complete integration example showing all tag features in action
 * This demonstrates:
 * 1. Displaying tags on work items
 * 2. Managing tags with edit modal
 * 3. Filtering work items by tags
 * 4. Showing tag statistics
 */

interface WorkItem {
  _id: string;
  title: string;
  description: string;
  tags: Array<{ _id: string; name: string }>;
  workspace: string;
}

export function TagsIntegrationExample({ workspaceId }: { workspaceId: string }) {
  // State management
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<WorkItem[]>([]);

  // Mock data - replace with actual API data
  const allWorkItems: WorkItem[] = [
    {
      _id: "1",
      title: "Fix login page bug",
      description: "Users cannot login with credentials",
      tags: [{ _id: "tag1", name: "bug" }, { _id: "tag2", name: "urgent" }],
      workspace: workspaceId,
    },
    {
      _id: "2",
      title: "Refactor database queries",
      description: "Optimize slow database queries",
      tags: [{ _id: "tag3", name: "tech-debt" }],
      workspace: workspaceId,
    },
    {
      _id: "3",
      title: "Add dark mode",
      description: "Implement dark theme support",
      tags: [{ _id: "tag4", name: "feature" }],
      workspace: workspaceId,
    },
  ];

  // Use work item tags hook for managing tags
  const { assignTags, isLoading } = useWorkItemTags({
    workItemId: selectedItem?._id || "",
    workspaceId,
  });

  // Handle tag filter application
  const handleApplyFilter = () => {
    if (selectedTags.length === 0) {
      setFilteredItems(allWorkItems);
    } else {
      const filtered = allWorkItems.filter((item) => {
        const itemTagIds = item.tags?.map((t) => t._id) || [];
        return selectedTags.some((tagId) => itemTagIds.includes(tagId));
      });
      setFilteredItems(filtered);
    }
  };

  // Handle tag updates
  const handleUpdateTags = async (newTags: string[]) => {
    if (selectedItem) {
      await assignTags(newTags);
      setShowTagManager(false);
    }
  };

  // Initialize filtered items on mount
  React.useEffect(() => {
    setFilteredItems(allWorkItems);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Tags Integration Example</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Filter Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Filter Work Items</h2>
          <TagFilterPanel
            workspaceId={workspaceId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            onApply={handleApplyFilter}
            compact={false}
          />
        </div>

        {/* Center: Work Items List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Work Items ({filteredItems.length})
          </h2>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No work items match the selected tags
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedItem(item)}
                >
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>

                  {/* Display tags with edit button */}
                  <WorkItemTags
                    tags={item.tags}
                    editable={true}
                    onEditTags={() => {
                      setSelectedItem(item);
                      setShowTagManager(true);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tag Statistics</h2>
          <TagStatistics
            workspaceId={workspaceId}
            workItems={allWorkItems}
            limit={10}
            compact={false}
          />
        </div>
      </div>

      {/* Detail View */}
      {selectedItem && (
        <div className="border rounded-lg p-6 bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
              <p className="text-gray-600">{selectedItem.description}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowTagManager(true)}
            >
              Manage Tags
            </Button>
          </div>

          {/* Tags display with full information */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags ({selectedItem.tags.length})</label>
            <WorkItemTags
              tags={selectedItem.tags}
              editable={false}
              variant="default"
            />
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {selectedItem && (
        <TagManager
          isOpen={showTagManager}
          onOpenChange={setShowTagManager}
          workspaceId={workspaceId}
          workItemId={selectedItem._id}
          currentTags={selectedItem.tags?.map((t) => t._id) || []}
          onTagsUpdate={handleUpdateTags}
          loading={isLoading}
          title={`Manage Tags for "${selectedItem.title}"`}
        />
      )}

      {/* Code Examples */}
      <div className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold">Code Examples</h2>

        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">1. Display Tags</h3>
            <pre className="text-xs overflow-x-auto">
{`import { WorkItemTags } from "@/components/issue/tags";

<WorkItemTags 
  tags={item.tags}
  editable={true}
  onEditTags={() => setShowTagManager(true)}
/>`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">2. Filter by Tags</h3>
            <pre className="text-xs overflow-x-auto">
{`import { TagFilterPanel } from "@/components/issue/tags";

<TagFilterPanel
  workspaceId={workspaceId}
  selectedTags={selectedTags}
  onTagsChange={setSelectedTags}
  onApply={handleApplyFilter}
/>`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">3. Manage Tags</h3>
            <pre className="text-xs overflow-x-auto">
{`import { TagManager } from "@/components/issue/tags";
import { useWorkItemTags } from "@/hooks/api/use-work-item-tags";

const { assignTags } = useWorkItemTags({
  workItemId,
  workspaceId
});

<TagManager
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  workspaceId={workspaceId}
  workItemId={itemId}
  currentTags={item.tags?.map(t => t._id) || []}
  onTagsUpdate={(tags) => assignTags(tags)}
/>`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">4. Show Statistics</h3>
            <pre className="text-xs overflow-x-auto">
{`import { TagStatistics } from "@/components/issue/tags";

<TagStatistics
  workspaceId={workspaceId}
  workItems={allWorkItems}
  limit={10}
  compact={false}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Features Summary */}
      <div className="space-y-4 border-t pt-6 bg-green-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold">Implemented Features ✅</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Display tags as styled badges with colors</li>
          <li>✅ Add/remove tags during work item creation</li>
          <li>✅ Edit tags on existing work items</li>
          <li>✅ Filter work items by multiple tags</li>
          <li>✅ Show tag usage statistics and distribution</li>
          <li>✅ Create new tags on-the-fly</li>
          <li>✅ Batch tag operations</li>
          <li>✅ Search and auto-suggest for tags</li>
          <li>✅ React Query caching (5-minute stale time)</li>
          <li>✅ TypeScript type safety throughout</li>
          <li>✅ Keyboard navigation support</li>
          <li>✅ Loading and error states</li>
          <li>✅ Toast notifications</li>
          <li>✅ Mobile responsive design</li>
          <li>✅ Accessibility best practices</li>
        </ul>
      </div>
    </div>
  );
}

export default TagsIntegrationExample;
