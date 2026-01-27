import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sprint } from '@/api/scrumboard/types';
import { useEditSprint } from '@/api/scrumboard/hooks/sprints/useEditSprint';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { toast } from '@/hooks/use-toast';

const sprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type SprintFormData = z.infer<typeof sprintSchema>;

interface SprintEditDialogProps {
  sprint: Sprint;
  open: boolean;
  onClose: () => void;
}

const SprintEditDialog: React.FC<SprintEditDialogProps> = ({
  sprint,
  open,
  onClose,
}) => {
  const workspaceId = useWorkspaceId();
  const editSprintMutation = useEditSprint();

  const form = useForm<SprintFormData>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: sprint.name || '',
      goal: sprint.goal || '',
      startDate: sprint.startDate?.slice(0, 10) || '',
      endDate: sprint.endDate?.slice(0, 10) || '',
    },
  });

  const onSubmit = async (data: SprintFormData) => {
    try {
      await editSprintMutation.mutateAsync({
        sprintId: sprint._id,
        workspaceId,
        data,
      });
      toast({ title: 'Success', description: 'Sprint updated successfully' });
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to update sprint', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>Update sprint details</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sprint 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Goal (Optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={editSprintMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSprintMutation.isPending}>
                {editSprintMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SprintEditDialog;
