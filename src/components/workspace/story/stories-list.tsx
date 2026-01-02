import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateStoryForm from "./create-story-form";
import EditStoryForm from "./edit-story-form";
import { getStoriesQueryFn, deleteStoryMutationFn } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

interface Story {
  _id: string;
  title: string;
  description?: string;
  epicId: string;
  tasks?: any[];
  createdAt?: string;
}

export default function StoriesList({ epicId }: { epicId: string }) {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const queryClient = useQueryClient();

  const { data: storiesData, isLoading } = useQuery({
    queryKey: ["stories", epicId],
    queryFn: () => getStoriesQueryFn(epicId),
  });

  const stories = storiesData?.stories || [];

  const { mutate: deleteStory, isPending: isDeleting } = useMutation({
    mutationFn: deleteStoryMutationFn,
  });

  const handleDelete = (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    deleteStory(storyId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["stories", epicId] });
        toast({
          title: "Success",
          description: "Story deleted successfully",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories</h2>
        <Button
          size="sm"
          onClick={() => setOpenCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Story
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No stories yet. Create one to get started!
        </div>
      ) : (
        <div className="grid gap-3">
          {stories.map((story: Story) => (
            <div
              key={story._id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {story.title}
                  </h3>
                  {story.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {story.description}
                    </p>
                  )}
                  {story.tasks && story.tasks.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {story.tasks.length} tasks
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStory(story);
                      setOpenEditDialog(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(story._id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
          </DialogHeader>
          <CreateStoryForm
            epicId={epicId}
            onClose={() => setOpenCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <EditStoryForm
              story={selectedStory}
              epicId={epicId}
              onClose={() => {
                setOpenEditDialog(false);
                setSelectedStory(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
