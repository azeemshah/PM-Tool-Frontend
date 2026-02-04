import React from "react";
import { useTags } from "@/hooks/api/use-tags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/tag/TagInput";
import { Loader2 } from "lucide-react";

interface TagManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workItemId: string;
  currentTags: string[];
  onTagsUpdate: (tags: string[]) => void;
  loading?: boolean;
  title?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onOpenChange,
  workspaceId,
  workItemId,
  currentTags,
  onTagsUpdate,
  loading = false,
  title = "Manage Tags",
}) => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(currentTags || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSelectedTags(currentTags || []);
  }, [currentTags, isOpen]);

  const handleSave = () => {
    setIsSubmitting(true);
    // Simulate save - in real implementation, this would call an API
    setTimeout(() => {
      onTagsUpdate(selectedTags);
      setIsSubmitting(false);
      onOpenChange(false);
    }, 500);
  };

  const isModified = JSON.stringify(selectedTags) !== JSON.stringify(currentTags);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Add or remove tags to organize and categorize this work item.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <TagInput
            workspaceId={workspaceId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            placeholder="Search or create tags..."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !isModified || loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Tags"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagManager;
