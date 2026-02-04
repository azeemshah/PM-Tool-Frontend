import React, { useState, useEffect } from "react";
import { useTags } from "@/hooks/api/use-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFilterPanelProps {
  workspaceId: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onApply?: () => void;
  compact?: boolean;
  className?: string;
}

interface TagWithCount {
  _id: string;
  name: string;
  count?: number;
}

export const TagFilterPanel: React.FC<TagFilterPanelProps> = ({
  workspaceId,
  selectedTags = [],
  onTagsChange,
  onApply,
  compact = false,
  className,
}) => {
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  const { getAllTagsByWorkspace } = useTags();
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: workspaceTags, isLoading: isLoadingTags } =
    getAllTagsByWorkspace(workspaceId);

  useEffect(() => {
    if (workspaceTags) {
      setTags(Array.isArray(workspaceTags) ? workspaceTags : []);
      setIsLoading(false);
    }
  }, [workspaceTags]);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleTag = (tagId: string) => {
    if (safeSelectedTags.includes(tagId)) {
      onTagsChange(safeSelectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...safeSelectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const handleApply = () => {
    onApply?.();
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 bg-card",
        compact && "p-2",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Filter by Tags</h3>
          {safeSelectedTags.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {safeSelectedTags.length}
            </span>
          )}
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="relative mb-3">
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3">
            {isLoadingTags ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Loading tags...
              </p>
            ) : filteredTags.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tags found
              </p>
            ) : (
              filteredTags.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    id={`tag-${tag._id}`}
                    checked={safeSelectedTags.includes(tag._id)}
                    onCheckedChange={() => handleToggleTag(tag._id)}
                  />
                  <label
                    htmlFor={`tag-${tag._id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                  >
                    {tag.name}
                  </label>
                  {tag.count !== undefined && (
                    <span className="text-xs text-gray-400">{tag.count}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={safeSelectedTags.length === 0}
            >
              Clear All
            </Button>
            {onApply && (
              <Button size="sm" onClick={handleApply}>
                Apply
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TagFilterPanel;
