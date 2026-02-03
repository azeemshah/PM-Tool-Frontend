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
  selectedTags,
  onTagsChange,
  onApply,
  compact = false,
  className,
}) => {
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
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
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
          {selectedTags.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedTags.length}
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
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3 h-8"
          />

          <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
            {isLoading || isLoadingTags ? (
              <div className="text-sm text-muted-foreground">
                Loading tags...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {searchTerm ? "No tags found" : "No tags available"}
              </div>
            ) : (
              filteredTags.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded transition-colors"
                >
                  <Checkbox
                    id={`tag-${tag._id}`}
                    checked={selectedTags.includes(tag._id)}
                    onCheckedChange={() => handleToggleTag(tag._id)}
                  />
                  <label
                    htmlFor={`tag-${tag._id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {tag.name}
                  </label>
                  {tag.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({tag.count})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedTags.length === 0}
              className="flex-1"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default TagFilterPanel;
