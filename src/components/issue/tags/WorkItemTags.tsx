import React from "react";
import { TagDisplay } from "./TagDisplay";
import { TagBadge } from "./TagBadge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkItemTagsProps {
  tags: any[];
  onEditTags?: () => void;
  editable?: boolean;
  className?: string;
  variant?: "default" | "outline" | "soft";
  limit?: number;
}

export const WorkItemTags: React.FC<WorkItemTagsProps> = ({
  tags = [],
  onEditTags,
  editable = false,
  className,
  variant = "default",
  limit,
}) => {
  if (!tags || tags.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-muted-foreground">No tags</span>
        {editable && onEditTags && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditTags}
            className="h-6 px-2"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <TagDisplay
        tags={tags}
        variant={variant}
        limit={limit}
        showMore={true}
      />
      {editable && onEditTags && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditTags}
          className="h-6 px-2"
          title="Edit tags"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export default WorkItemTags;
