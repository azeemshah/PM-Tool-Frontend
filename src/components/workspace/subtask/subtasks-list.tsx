import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  getSubtasksQueryFn,
  deleteSubtaskMutationFn,
  updateSubtaskMutationFn,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CreateSubtaskForm from "./create-subtask-form";
import EditSubtaskForm from "./edit-subtask-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Subtask {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedTo?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export default function SubtasksList({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: () => getSubtasksQueryFn(taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubtaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      toast({
        title: "Success",
        description: "Subtask deleted successfully",
        variant: "success",
      });
      setIsDeleteAlertOpen(false);
      setSelectedSubtask(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subtasks = data?.data || data || [];

  const handleEdit = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubtask) {
      deleteMutation.mutate(selectedSubtask._id);
    }
  };

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load subtasks
      </div>
    );
  }

  return (
    <div className="space-y-4 ml-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Subtasks</h3>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Subtask
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : subtasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground text-sm">
            No subtasks created yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask: Subtask) => (
            <Card key={subtask._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm">{subtask.title}</CardTitle>
                    {subtask.description && (
                      <CardDescription className="mt-1 text-xs">
                        {subtask.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subtask)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subtask)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-0">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {subtask.status && <span>Status: {subtask.status}</span>}
                  {subtask.priority && <span>Priority: {subtask.priority}</span>}
                  {subtask.assignedTo && (
                    <span>Assigned: {subtask.assignedTo.name}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subtask</DialogTitle>
            <DialogDescription>
              Create a new subtask for this task
            </DialogDescription>
          </DialogHeader>
          <CreateSubtaskForm
            taskId={taskId}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subtask</DialogTitle>
            <DialogDescription>
              Update subtask details
            </DialogDescription>
          </DialogHeader>
          {selectedSubtask && (
            <EditSubtaskForm
              subtask={selectedSubtask}
              onClose={() => {
                setIsEditDialogOpen(false);
                setSelectedSubtask(null);
              }}
              taskId={taskId}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSubtask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
