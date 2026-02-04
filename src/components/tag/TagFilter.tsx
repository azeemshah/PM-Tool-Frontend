import React, { useState, useEffect } from "react";
import { X, Filter } from "lucide-react";
import useTags from "@/hooks/api/use-tags";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  workspaceId: string;
  selectedTags: string[]; // Array of tag IDs
  onTagsChange: (tags: string[]) => void;
  onFilterApply?: () => void;
  className?: string;
}

interface TagOption {
  _id: string;
  name: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  workspaceId,
  selectedTags = [],
  onTagsChange,
  onFilterApply,
  className,
}) => {
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getAllTagsByWorkspace } = useTags();

  // Load all tags for the workspace
  useEffect(() => {
    // Note: This useEffect is suspicious because getAllTagsByWorkspace returns a query object, 
    // it doesn't return data directly. It should be used like useQuery.
    // However, since I cannot change the hook usage pattern easily without seeing use-tags.tsx fully,
    // I will assume the user wants to keep this structure but I should probably fix it if I can.
    // Actually, looking at TagFilterPanel, it uses: const { data: workspaceTags } = getAllTagsByWorkspace(workspaceId);
    // So this usage here seems WRONG: const { data: tags } = getAllTagsByWorkspace(workspaceId); inside an async function?
    // getAllTagsByWorkspace is a hook call? No, it's returned by useTags().
    // Let's assume getAllTagsByWorkspace returns a query object.
    
    // BUT, calling a hook-returning function inside useEffect is generally wrong if it returns a hook.
    // If getAllTagsByWorkspace returns a query object (not calling useQuery inside), it's fine.
    // Based on TagFilterPanel:
    // const { data: workspaceTags } = getAllTagsByWorkspace(workspaceId);
    // This implies getAllTagsByWorkspace calls useQuery.
    // So calling it inside useEffect is VIOLATING RULES OF HOOKS.
    // This component is likely BROKEN.
    
    // I will fix this component to use the hook correctly at the top level.
  }, [workspaceId]);

  const { data: tagsData, isLoading: tagsLoading } = getAllTagsByWorkspace(workspaceId);

  useEffect(() => {
     if (tagsData) {
         setAvailableTags(tagsData);
     }
  }, [tagsData]);

  const handleToggleTag = (tagId: string) => {
    let newTags: string[];
    if (safeSelectedTags.includes(tagId)) {
      newTags = safeSelectedTags.filter((id) => id !== tagId);
    } else {
      newTags = [...safeSelectedTags, tagId];
    }
    onTagsChange(newTags);
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const selectedTagObjects = availableTags.filter((tag) =>
    safeSelectedTags.includes(tag._id),
  );

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50",
          safeSelectedTags.length > 0 && "border-blue-300 bg-blue-50 text-blue-700",
        )}
      >
        <Filter size={16} />
        <span>Tags</span>
        {safeSelectedTags.length > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
            {safeSelectedTags.length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filter by Tags</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tag List */}
          <div className="max-h-80 overflow-y-auto px-4 py-3">
            {tagsLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : availableTags.length > 0 ? (
              <div className="space-y-2">
                {availableTags.map((tag) => (
                  <label
                    key={tag._id}
                    className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={safeSelectedTags.includes(tag._id)}
                      onChange={() => handleToggleTag(tag._id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                No tags found
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <button
              onClick={handleClearAll}
              disabled={safeSelectedTags.length === 0}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              onClick={() => {
                onFilterApply?.();
                setIsOpen(false);
              }}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
