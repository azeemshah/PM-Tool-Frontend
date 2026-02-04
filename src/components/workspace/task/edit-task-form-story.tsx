import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, Download, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformOptions,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateTaskMutationFn, deleteAttachmentById, deleteAttachmentByUrl, getWorkItemAttachments } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";

interface Task {
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
  dueDate?: string;
  storyId?: string;
}

type AttachmentUI = { _id: string; url: string; name: string };

export default function EditTaskForm(props: {
  task: Task;
  storyId?: string;
  workspaceId?: string;
  onClose: () => void;
}) {
  const { task, storyId, onClose } = props;

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [attachments, setAttachments] = useState<AttachmentUI[]>([]);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: updateTaskMutationFn,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const members = Array.isArray(memberData) ? memberData : (memberData?.members || []);

  // Workspace Members
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
    status: z.enum(
      Object.values(TaskStatusEnum) as [string, ...string[]],
      {
        required_error: "Status is required",
      }
    ),
    priority: z.enum(
      Object.values(TaskPriorityEnum) as [string, ...string[]],
      {
        required_error: "Priority is required",
      }
    ),
    assignedTo: z.string().trim().min(1, {
      message: "AssignedTo is required",
    }),
    dueDate: z.date({
      required_error: "A date is required.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      status: (task.status || "TODO") as any,
      priority: (task.priority || "MEDIUM") as any,
      assignedTo: task.assignedTo?._id || "",
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
    },
  });

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

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
    const payload = {
      taskId: task._id,
      data: {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assignedTo: values.assignedTo,
        dueDate: values.dueDate.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        const invalidateKey = storyId || task.storyId;
        if (invalidateKey) {
          queryClient.invalidateQueries({
            queryKey: ["tasks", invalidateKey],
          });
        }

        toast({
          title: "Success",
          description: "Task updated successfully",
          variant: "success",
        });
        onClose();
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
        targetId = match?._id || "";
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

            {/* {Due Date} */}
            <div className="!mt-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full flex-1 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={
                            (date) =>
                              date >
                                new Date("2100-12-31") //Prevent selection beyond a far future date
                          }
                          initialFocus
                          defaultMonth={field.value || new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Status} */}

            <div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            className="!text-muted-foreground !capitalize"
                            placeholder="Select a status"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions?.map((status) => (
                          <SelectItem
                            className="!capitalize"
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Priority} */}
            <div>
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions?.map((priority) => (
                          <SelectItem
                            className="!capitalize"
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar">
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

            <Button
              className="flex place-self-end  h-[40px] text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin" />}
              Update
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
