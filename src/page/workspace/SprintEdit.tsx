import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetWorkspaceSprints } from '@/api/scrumboard/hooks/sprints/useGetWorkspaceSprints';
import { useUpdateSprint } from '@/api/scrumboard/hooks/sprints/useUpdateSprint';
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
import { toast } from '@/hooks/use-toast';

const sprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type SprintFormData = z.infer<typeof sprintSchema>;

const SprintEdit: React.FC = () => {
  const { workspaceId, sprintId } = useParams<{ workspaceId: string; sprintId: string }>();
  const navigate = useNavigate();

  const { data: sprints = [], isLoading } = useGetWorkspaceSprints(workspaceId!);
  const sprint = useMemo(() => sprints.find((s) => s._id === sprintId), [sprints, sprintId]);

  const updateSprintMutation = useUpdateSprint(workspaceId);

  const form = useForm<SprintFormData>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: sprint?.name ?? '',
      goal: sprint?.goal ?? '',
      startDate: sprint?.startDate ? new Date(sprint.startDate).toISOString().slice(0, 10) : '',
      endDate: sprint?.endDate ? new Date(sprint.endDate).toISOString().slice(0, 10) : '',
    },
    values: sprint
      ? {
          name: sprint.name ?? '',
          goal: sprint.goal ?? '',
          startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().slice(0, 10) : '',
          endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().slice(0, 10) : '',
        }
      : undefined,
  });

  const onSubmit = async (values: SprintFormData) => {
    if (!sprintId) return;
    try {
      await updateSprintMutation.mutateAsync({
        sprintId,
        body: {
          name: values.name,
          goal: values.goal,
          startDate: values.startDate,
          endDate: values.endDate,
        },
      });
      toast({ title: 'Success', description: 'Sprint updated successfully', variant: 'success' });
      navigate(-1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update sprint',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Edit Sprint</h1>
        <p className="text-sm text-muted-foreground">Create Sprint jaisa hi form — details edit karen.</p>
      </div>

      {isLoading && <div className="rounded-md border p-3 text-sm">Loading sprint...</div>}
      {!isLoading && !sprint && (
        <div className="rounded-md border p-3 text-sm">Sprint not found</div>
      )}

      {sprint && (
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
                    <Textarea
                      placeholder="What do you want to achieve in this sprint?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={updateSprintMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateSprintMutation.isPending}>
                {updateSprintMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default SprintEdit;
