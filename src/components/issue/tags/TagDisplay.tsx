import React from "react";
import { TagBadge } from "./TagBadge";
import { cn } from "@/lib/utils";

interface TagDisplayProps {
  tags: Array<{ _id: string; name: string }> | string[];
  onRemoveTag?: (tagId: string) => void;
  removable?: boolean;
  variant?: "default" | "outline" | "soft";
  className?: string;
  emptyMessage?: string;
  limit?: number;
  showMore?: boolean;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({
  tags,
  onRemoveTag,
  removable = false,
  variant = "default",
  className,
  emptyMessage = "No tags assigned",
  limit,
  showMore = true,
}) => {
  if (!tags || tags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }

  // Normalize tags to objects
  const tagObjects = tags.map((tag) => {
    if (typeof tag === "string") {
      return { _id: tag, name: tag };
    }
    return tag;
  });

  const displayTags = limit ? tagObjects.slice(0, limit) : tagObjects;
  const hiddenCount = limit && tagObjects.length > limit 
    ? tagObjects.length - limit 
    : 0;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {displayTags.map((tag) => (
        <TagBadge
          key={tag._id}
          tagId={tag._id}
          name={tag.name}
          variant={variant}
          removable={removable}
          onRemove={onRemoveTag}
        />
      ))}
      {showMore && hiddenCount > 0 && (
        <span className="text-xs text-muted-foreground px-2 py-1">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
};

export default TagDisplay;
