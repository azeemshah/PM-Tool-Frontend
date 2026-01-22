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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { CreateItemDto, ItemPriority, ItemType } from '@/api/issue/types';
import { ISSUE_TYPES_LIST } from '@/components/issue/constants';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';

const workItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['Task', 'Bug', 'Story', 'Epic']).default('Task'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
});

type WorkItemFormData = z.infer<typeof workItemSchema>;

interface WorkItemCreationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  boardId: string;
  listId: string;
}

const WorkItemCreationDialog: React.FC<WorkItemCreationDialogProps> = ({
  open,
  onClose,
  workspaceId,
  boardId,
  listId,
}) => {
  const queryClient = useQueryClient();
  const form = useForm<WorkItemFormData>({
    resolver: zodResolver(workItemSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'Task',
      priority: 'Medium',
    },
  });

  const createWorkItemMutation = useMutation({
    mutationFn: (data: CreateItemDto) => issueApiService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-items', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });

      toast({
        title: 'Success',
        description: 'Work item created successfully',
      });

      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to create work item:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create work item',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: WorkItemFormData) => {
    try {
      const payload: CreateItemDto = {
        title: data.title,
        description: data.description || undefined,
        type: data.type.toLowerCase() as ItemType,
        priority: data.priority.toLowerCase() as ItemPriority,
        workspace: workspaceId,
        status: 'Backlog',
        column: listId || undefined, // Pass the column ID (listId) so it gets assigned to the correct column/status
      };

      await createWorkItemMutation.mutateAsync(payload);
    } catch (error) {
      // Error handled in onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>
            Add a new work item to your backlog for sprint planning.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter work item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work item..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ISSUE_TYPES_LIST.filter(t => t.value !== 'subtask').map((type) => (
                          <SelectItem key={type.value} value={type.label}>
                            <div className="flex items-center gap-2">
                              <IssueTypeIcon type={type.value} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Work Item
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkItemCreationDialog;