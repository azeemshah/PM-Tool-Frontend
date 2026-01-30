import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, Trash2, Download } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { deleteAttachmentById, deleteAttachmentByUrl, getWorkItemAttachments } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/api/issue/types";
import FileUpload from "@/components/ui/file-upload";
import { useGetKanbanBoards } from "@/api/kanban/hooks/boards/useGetKanbanBoards";
import { useGetKanbanBoardLists } from "@/api/kanban/hooks/lists/useGetKanbanBoardLists";
import { mapColumnToStatus } from "@/lib/helper";
import type { IssueStatus } from "@/api/issue/types";
import { ParentSelector } from "@/components/issue/ParentSelector";
import { IssueTypeIcon } from "@/components/issue/IssueTypeIcon";
import { useQuery } from "@tanstack/react-query";

const API_PRIORITY_MAP = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

type AttachmentUI = { _id: string; url: string; name: string };

export default function EditTaskForm({ task, onClose }: { task: TaskType; onClose: () => void }) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [attachments, setAttachments] = useState<AttachmentUI[]>([]);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

  const { data: kanbanBoards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId = kanbanBoards && kanbanBoards.length > 0 ? (kanbanBoards[0] as any)._id : null;
  const { data: boardLists = [] } = useGetKanbanBoardLists(defaultBoardId || null);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: any }) => issueApiService.updateIssue(issueId, data),
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = Array.isArray(memberData) ? memberData : (memberData?.members || []);

  // Members Dropdown Options
  const membersOptions = members.map((member) => {
    const userObj = member.user || member.userId;
    const name = userObj?.name || (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : "Unknown");
    return {
      label: name,
      value: userObj?._id || (typeof userObj === 'string' ? userObj : ""),
    };
  });

  const statusOptions = boardLists && boardLists.length > 0
    ? boardLists.map((list: any) => ({
      label: list.name,
      value: list.name,
    }))
    : Object.values(TaskStatusEnum).map((value) => ({
      label: value,
      value,
    }));

  const priorityOptions = Object.keys(TaskPriorityEnum).map((key) => ({
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    value: key as keyof typeof TaskPriorityEnum,
  }));

  const findColumnIdForStatus = (status: IssueStatus): string | null => {
    const lists = boardLists || [];
    if (!lists || lists.length === 0) return null;
    const match = (lists as any[]).find((list) => {
      const name = (list && (list as any).name) || "";
      const mapped = mapColumnToStatus(String(name));
      return mapped === status;
    });
    if (!match) return null;
    const id = (match as any)._id || (match as any).id;
    return id ? String(id) : null;
  };

  // Helper function to convert API priority to form priority
  const apiPriorityToFormPriority = (apiPriority: string): keyof typeof TaskPriorityEnum => {
    const reverseMap: Record<string, keyof typeof TaskPriorityEnum> = {
      "lowest": "LOW",
      "low": "LOW",
      "medium": "MEDIUM",
      "high": "HIGH",
      "highest": "HIGH",
    };
    return reverseMap[apiPriority] || "MEDIUM";
  };

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: "Title is required" }),
    description: z.string().trim(),
    status: z.string().min(1, { message: "Status is required" }),
    priority: z.enum(Object.values(TaskPriorityEnum) as [string, ...string[]]),
    assignedTo: z.string().trim().optional(),
    dueDate: z.date().optional(),
    parent: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: (task?.status as string) || TaskStatusEnum.TO_DO,
      priority: apiPriorityToFormPriority(task?.priority ?? "medium"),
      assignedTo: task.assignedTo?._id ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      parent: task?.parent || (task as any)?.epic?._id || undefined,
    },
  });

  const { data: workspaceItems = [] } = useQuery({
    queryKey: ['workspace-items', workspaceId],
    queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
    enabled: !!workspaceId && String(task.type).toLowerCase() === 'subtask',
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const loadAttachments = async () => {
      try {
        const items = await getWorkItemAttachments(String(task._id));
        setAttachments(items);
      } catch (e) {
        // ignore
      }
    };
    loadAttachments();
  }, [task._id]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    const issueStatus = mapColumnToStatus(values.status);
    const targetColumnId = findColumnIdForStatus(issueStatus);
    const taskId = String(task._id);

    const payload = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: API_PRIORITY_MAP[values.priority as keyof typeof API_PRIORITY_MAP] || "medium",
      assignedTo: values.assignedTo || null, // Send null if not assigned
      dueDate: values.dueDate ? values.dueDate.toISOString() : null, // Send null if no due date
      parent: values.parent || null,
    };

    mutate({ issueId: taskId, data: payload }, {
      onSuccess: async () => {
        onClose();

        // Delay invalidation to allow dialog to close properly and prevent UI freeze
        setTimeout(async () => {
          // Manual cleanup to prevent UI freeze
          document.body.style.pointerEvents = "";
          document.body.style.overflow = "";

          queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
          queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
          toast({
            title: "Success",
            description: "Task updated successfully",
            variant: "success",
          });
          if (targetColumnId && workspaceId) {
            try {
              const kanbanQueryKey = ["all-tasks", "kanban", workspaceId || "unknown"];
              queryClient.setQueryData(kanbanQueryKey, (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((item: any) => {
                  if (String(item._id) === taskId) {
                    return {
                      ...item,
                      column: targetColumnId,
                      status: values.status,
                    };
                  }
                  return item;
                });
              });
              await issueApiService.moveItemToColumn(taskId, targetColumnId);
              queryClient.invalidateQueries({ queryKey: ["all-tasks", "kanban"] });
            } catch (error) {
              console.error("Failed to move item column after task update:", error);
              queryClient.invalidateQueries({ queryKey: ["all-tasks", "kanban"] });
            }
          }
        }, 300);
      },
      onError: (error: any) => {
        console.error("Update error:", error);
        toast({
          title: "Error",
          description: error?.response?.data?.message || error.message || "Failed to update task",
          variant: "destructive",
        });
      },
    });
  };

  const handleAttachmentUploaded = async (url: string) => {
    try {
      if (url) {
        const name = url.split('/').pop() || 'attachment';
        setAttachments((prev) => [...prev, { _id: `temp-${Date.now()}`, url, name }]);
      }
      const items = await getWorkItemAttachments(String(task._id));
      if (Array.isArray(items) && items.length > 0) {
        setAttachments(items);
      }
      toast({
        title: "Success",
        description: "Attachment uploaded successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attachments after upload",
        variant: "destructive",
      });
    }
  };


  const handleDeleteAttachment = async (att: AttachmentUI) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    setDeletingAttachment(att._id || att.url);
    try {
      let targetId = att._id;
      if (!targetId || targetId.startsWith('temp-')) {
        const items = await getWorkItemAttachments(String(task._id));
        const match = items.find((x) => x.url === att.url || x.name === att.name);
        targetId = match?._id;
      }
      if (!targetId) {
        await deleteAttachmentByUrl(att.url);
        setAttachments((prev) => prev.filter((a) => a.url !== att.url));
      } else {
        await deleteAttachmentById(targetId);
        setAttachments((prev) => prev.filter((a) => a._id !== att._id && a.url !== att.url));
      }
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    } finally {
      setDeletingAttachment(null);
    }
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl font-semibold text-center sm:text-left">Edit Task</h1>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl><Input {...field} placeholder="Task title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl><Textarea {...field} rows={2} placeholder="Description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Assigned To */}
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                      {membersOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Due Date */}
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline">
                        {field.value ? format(field.value, "PPP") : "No due date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            {/* Parent/Epic Selection */}
            {['story', 'task', 'bug', 'subtask'].includes(String(task.type).toLowerCase()) && (
              <FormField
                control={form.control}
                name="parent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {String(task.type).toLowerCase() === 'subtask' ? "Parent Issue" : "Epic (Optional)"}
                    </FormLabel>
                    <FormControl>
                      {String(task.type).toLowerCase() === 'subtask' ? (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            ((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                              .filter((item: any) => ['story', 'task', 'bug'].includes(String(item.type).toLowerCase())).length === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent issue..." />
                          </SelectTrigger>
                          <SelectContent>
                            {((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                              .filter((item: any) => ['story', 'task', 'bug'].includes(String(item.type).toLowerCase())).length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">
                                No parent issues available.
                              </div>
                            ) : (
                              ((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                                .filter((item: any) => ['story', 'task', 'bug'].includes(String(item.type).toLowerCase()) && item._id !== task._id)
                                .map((item) => (
                                  <SelectItem key={item._id} value={item._id}>
                                    <div className="flex items-center gap-2">
                                      <IssueTypeIcon type={String(item.type).toLowerCase() as any} />
                                      <span>{item.title}</span>
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <ParentSelector
                          issueType={String(task.type).toLowerCase() as any}
                          parentId={field.value || ""}
                          onChange={field.onChange}
                          projectId={workspaceId}
                          optional={true}
                          showLabel={false}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Status */}
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Priority */}
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Attachments Section */}
            <div className="border-t pt-4 mt-4">
              <FormLabel className="text-base font-semibold mb-3 block">Attachments</FormLabel>

              {/* Upload Section */}
              <div className="mb-4">
                <FileUpload
                  type="task"
                  id={task._id}
                  onUploaded={handleAttachmentUploaded}
                />
              </div>

              {/* Attachments List */}
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attachments.map((att, index) => {
                      const fileNameRaw = att.name || att.url.split("/").pop() || `Attachment ${index + 1}`;
                      const fileName = (() => {
                        const parts = String(fileNameRaw).split("-");
                        return parts.length >= 3 ? parts.slice(2).join("-") : fileNameRaw;
                      })();
                      const apiBase: string | undefined = import.meta.env.VITE_API_BASE_URL as any;
                      const apiOrigin = (() => {
                        try {
                          return apiBase ? new URL(apiBase).origin : window.location.origin;
                        } catch {
                          return window.location.origin;
                        }
                      })();
                      const absoluteUrl = att.url.startsWith("http") ? att.url : `${apiOrigin}${att.url}`;
                      return (
                        <div
                          key={att._id}
                          className="flex items-center justify-between p-2 bg-gray-100 rounded-md cursor-pointer"
                          onClick={() => window.open(absoluteUrl, '_blank', 'noopener')}
                        >
                          <a
                            href={absoluteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline truncate flex-1"
                          >
                            <Download className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-sm">{fileName}</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(att); }}
                            disabled={deletingAttachment === att._id || deletingAttachment === att.url}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete attachment"
                          >
                            {deletingAttachment === att._id || deletingAttachment === att.url ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attachments yet</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader className="animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}





