import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateEpicForm from "./create-epic-form";
import EditEpicForm from "./edit-epic-form";
import { getEpicsQueryFn, deleteEpicMutationFn } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

interface Epic {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  stories?: any[];
  createdAt?: string;
}

export default function EpicsList({ projectId }: { projectId: string }) {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const queryClient = useQueryClient();

  const { data: epicsData, isLoading } = useQuery({
    queryKey: ["epics", projectId],
    queryFn: () => getEpicsQueryFn(projectId),
  });

  const epics = epicsData?.epics || [];

  const { mutate: deleteEpic, isPending: isDeleting } = useMutation({
    mutationFn: deleteEpicMutationFn,
  });

  const handleDelete = (epicId: string) => {
    if (!confirm("Are you sure you want to delete this epic?")) return;

    deleteEpic(epicId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["epics", projectId] });
        toast({
          title: "Success",
          description: "Epic deleted successfully",
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
        <h2 className="text-lg font-semibold">Epics</h2>
        <Button
          size="sm"
          onClick={() => setOpenCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Epic
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : epics.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No epics yet. Create one to get started!
        </div>
      ) : (
        <div className="grid gap-3">
          {epics.map((epic: Epic) => (
            <div
              key={epic._id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {epic.title}
                  </h3>
                  {epic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {epic.description}
                    </p>
                  )}
                  {epic.stories && epic.stories.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {epic.stories.length} stories
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEpic(epic);
                      setOpenEditDialog(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(epic._id)}
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
            <DialogTitle>Create New Epic</DialogTitle>
          </DialogHeader>
          <CreateEpicForm
            projectId={projectId}
            onClose={() => setOpenCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Epic</DialogTitle>
          </DialogHeader>
          {selectedEpic && (
            <EditEpicForm
              epic={selectedEpic}
              projectId={projectId}
              onClose={() => {
                setOpenEditDialog(false);
                setSelectedEpic(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}





