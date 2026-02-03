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
  selectedTags,
  onTagsChange,
  onFilterApply,
  className,
}) => {
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getAllTagsByWorkspace } = useTags();

  // Load all tags for the workspace
  useEffect(() => {
    const loadTags = async () => {
      setIsLoading(true);
      const { data: tags } = getAllTagsByWorkspace(workspaceId);
      if (tags) {
        setAvailableTags(tags);
      }
      setIsLoading(false);
    };

    if (workspaceId) {
      loadTags();
    }
  }, [workspaceId]);

  const handleToggleTag = (tagId: string) => {
    let newTags: string[];
    if (selectedTags.includes(tagId)) {
      newTags = selectedTags.filter((id) => id !== tagId);
    } else {
      newTags = [...selectedTags, tagId];
    }
    onTagsChange(newTags);
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const selectedTagObjects = availableTags.filter((tag) =>
    selectedTags.includes(tag._id),
  );

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50",
          selectedTags.length > 0 && "border-blue-300 bg-blue-50 text-blue-700",
        )}
      >
        <Filter size={16} />
        <span>Tags</span>
        {selectedTags.length > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
            {selectedTags.length}
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
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading tags...</div>
            ) : availableTags.length > 0 ? (
              <div className="space-y-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag._id);
                  return (
                    <label
                      key={tag._id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTag(tag._id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tags available
              </div>
            )}
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedTagObjects.map((tag) => (
                  <div
                    key={tag._id}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleToggleTag(tag._id)}
                      className="hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    onFilterApply?.();
                    setIsOpen(false);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
