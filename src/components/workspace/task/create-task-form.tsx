import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { LabelsSelector } from '@/components/kanban/dialogs/LabelsSelector';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import {
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTaskMutationFn, createTaskWithoutEpicMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { TagInput } from '@/components/tag/TagInput';

export default function CreateTaskForm(props: {
  workspaceId?: string;
  onClose: () => void;
}) {
  const { workspaceId: propWorkspaceId, onClose } = props;

  const queryClient = useQueryClient();
  const workspaceId = propWorkspaceId || useWorkspaceId();

  const { statuses: dynamicStatuses } = useGetWorkspaceStatuses(workspaceId);
  const { data: boards = [] } = useGetKanbanBoards(workspaceId);
  const effectiveBoardId = (Array.isArray(boards) && boards.length > 0 ? boards[0]._id : undefined);

  // Mutation for creating task in workspace
  const { mutate: mutateIndependentTask, isPending: isIndependentTaskPending } = useMutation({
    mutationFn: createTaskWithoutEpicMutationFn,
  });

  const isPending = isIndependentTaskPending;

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const members = Array.isArray(memberData) ? memberData : (memberData?.members || []);

  // Workspace Memebers
  const membersOptions = members?.map((member) => {
    const userObj = member.user || member.userId;
    const name = userObj?.name || (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : "Unknown");
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);

    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={userObj?.profilePicture || ""} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: userObj?._id || (typeof userObj === 'string' ? userObj : ""),
    };
  });

  const formSchema = z.object({
    title: z.string().trim().min(1, {
      message: "Title is required",
    }),
    description: z.string().trim().optional(),
    status: z.string().min(1, {
      message: "Status is required",
    }),
    priority: z.string().min(1, {
      message: "Priority is required",
    }),
    assignedTo: z.string().trim().min(1, {
      message: "AssignedTo is required",
    }),
    reporter: z.string().trim().min(1, {
      message: "Reporter is required",
    }),
    dueDate: z.date().optional(),
    labels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      reporter: members.length > 0 ? members[0].userId._id : "",
      labels: [],
      tags: [],
    },
  });

  const STATUSES = ["todo", "in_progress", "in_review", "done"];
  const PRIORITIES = ["low", "medium", "high"];

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    const taskData = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      assignedTo: values.assignedTo,
      reporter: values.reporter,
      dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      labels: values.labels,
      tags: values.tags,
    };

    // Create task in workspace
    {
      const payload = {
        workspaceId,
        data: taskData,
      };

      mutateIndependentTask(payload, {
        onSuccess: () => {
          onClose();

          // Delay invalidation to allow dialog to close properly and prevent UI freeze
          setTimeout(() => {
            // Manual cleanup to prevent UI freeze
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";

            queryClient.invalidateQueries({
              queryKey: ["tasks", "all"],
            });
            queryClient.invalidateQueries({
              queryKey: ["allTasks"],
            });
            queryClient.invalidateQueries({
              queryKey: ["issues", "workspace", workspaceId],
            });
            queryClient.invalidateQueries({
              queryKey: ["all-tasks"],
            });
            queryClient.invalidateQueries({
              queryKey: ["recent-tasks"],
            });
            queryClient.invalidateQueries({
              queryKey: ["workspace-analytics"],
            });
            queryClient.invalidateQueries({
              queryKey: ["project-analytics"],
            });

            toast({
              title: "Success",
              description: "Task created successfully",
              variant: "success",
            });
          }, 300);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b dark:border-border">
          <h1
            className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1
           text-center sm:text-left"
          >
            Create Task
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize and manage tasks, resources, and team collaboration
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Description} */}
            <div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={1} placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            {/* {Members AssigneeTo} */}

            <div>
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div
                          className="w-full max-h-[200px]
                           overflow-y-auto scrollbar
                          "
                        >
                          {membersOptions?.map((option) => (
                            <SelectItem
                              className="cursor-pointer"
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date */}
            <div>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
                        disabled={isPending}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dynamicStatuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority */}
            <div>
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reporter */}
            <div>
              <FormField
                control={form.control}
                name="reporter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reporter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                          {membersOptions?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Labels */}
            {effectiveBoardId && (
              <div>
                <FormField
                  control={form.control}
                  name="labels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labels</FormLabel>
                      <FormControl>
                        <LabelsSelector
                          boardId={effectiveBoardId}
                          selectedLabelIds={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        workspaceId={workspaceId}
                        selectedTags={field.value || []}
                        onTagsChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              className="flex place-self-end  h-[40px] font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin" />}
              Create
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}





