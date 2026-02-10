import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, Trash2, Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
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
import { mapColumnToStatus, getProfileImageUrl, getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { IssueStatus } from "@/api/issue/types";
import { ParentSelector } from "@/components/issue/ParentSelector";
import { IssueTypeIcon } from "@/components/issue/IssueTypeIcon";
import { useQuery } from "@tanstack/react-query";
import { LogWorkDialog } from "@/components/issue/LogWorkDialog";
import { TimeTrackingSummary, TimerButton, TimeLogsList } from "@/components/time-tracking";
import { getGanttStatusColor } from "@/components/gantt-chart/utils/colorMaps";
import { getStatusIcon } from "./table/data";

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
  const [logWorkOpen, setLogWorkOpen] = useState(false);

  const { data: kanbanBoards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId = kanbanBoards && kanbanBoards.length > 0 ? (kanbanBoards[0] as any)._id : null;
  const { data: boardLists = [] } = useGetKanbanBoardLists(defaultBoardId || null);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: any }) => issueApiService.updateIssue(issueId, data),
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = Array.isArray(memberData) ? memberData : (memberData?.members || []);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Custom fields state
  const [customFields, setCustomFields] = useState<any[]>((task as any).customFields || []);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
  const customFieldsSectionRef = useRef<HTMLDivElement | null>(null);
  const newFieldNameRef = useRef<HTMLInputElement | null>(null);

  const CustomFieldTypes = [
    'text',
    'number',
    'dropdown',
    'multi-select',
    'checkbox',
    'date',
    'user',
    'url',
  ];

  const handleTopToolbarClick = (type: string) => {
    // create a new empty custom field of given type and focus its name input
    const idx = customFields.length;
    const field: any = { id: `field-${Date.now()}-${Math.random()}`, name: '', fieldType: type, isEditing: true };
    if (type === 'dropdown' || type === 'multi-select') field.options = [];
    if (type === 'checkbox') field.value = false; else field.value = '';
    setCustomFields((s) => [...s, field]);
    setNewlyAddedIndex(idx);

    setTimeout(() => {
      if (customFieldsSectionRef.current) {
        customFieldsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateCustomFieldValue = (idx: number, value: any) => {
    setCustomFields((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], value };
      if (copy[idx].fieldType === 'user') copy[idx].userValue = value;
      return copy;
    });
  };

  const removeCustomField = (idx: number) => {
    setCustomFields((s) => s.filter((_, i) => i !== idx));
  };

  // focus newly added field name input when inserted
  useEffect(() => {
    if (newlyAddedIndex === null) return;
    setTimeout(() => {
      try {
        if (newFieldNameRef.current) newFieldNameRef.current.focus();
      } catch (_) { }
      setNewlyAddedIndex(null);
    }, 150);
  }, [newlyAddedIndex]);

  // Members Dropdown Options
  const membersOptions = members.map((member) => {
    const userObj = member.user || member.userId;
    const name = userObj?.name || (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : "Unknown");
    return {
      label: name,
      value: userObj?._id || (typeof userObj === 'string' ? userObj : ""),
      profilePicture: userObj?.profilePicture,
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
      "low": "LOW",
      "medium": "MEDIUM",
      "high": "HIGH",
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
    originalEstimate: z.number().optional(),
    storyPoints: z.number().optional(),
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
      originalEstimate: (task as any)?.originalEstimate ? Math.round((task as any).originalEstimate / 60) : undefined,
      storyPoints: (task as any)?.storyPoints || undefined,
    },
  });

  // Fetch detailed issue to get custom fields and latest data
  const { data: detailedIssue } = useQuery({
    queryKey: ['issue', String(task._id)],
    queryFn: () => issueApiService.getIssue(String(task._id)),
    enabled: !!task._id,
    staleTime: 0,
  });

  useEffect(() => {
    if (detailedIssue && detailedIssue.customFields) {
      setCustomFields(detailedIssue.customFields);
    }
  }, [detailedIssue]);

  const { data: workspaceItems = [] } = useQuery({
    queryKey: ['workspace-items', workspaceId],
    queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
    enabled: !!workspaceId && String(task.type).toLowerCase() === 'subtask',
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['issue-logs', String(task._id)],
    queryFn: async () => {
      const logs = await issueApiService.getIssueLogs(String(task._id));
      return logs || [];
    },
    enabled: !!task._id,
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

    const cleanCustomFields = (fields: any[]) => {
      return fields.map(f => ({
        name: f.name,
        fieldType: f.fieldType,
        value: f.value,
        options: f.options,
        userValue: (f.userValue && typeof f.userValue === 'object') ? f.userValue._id : f.userValue
      }));
    };

    const payload = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: API_PRIORITY_MAP[values.priority as keyof typeof API_PRIORITY_MAP] || "medium",
      assignedTo: values.assignedTo || null, // Send null if not assigned
      dueDate: values.dueDate ? values.dueDate.toISOString() : null, // Send null if no due date
      parent: values.parent || null,
      storyPoints: values.storyPoints,
      originalEstimate: values.originalEstimate ? Math.round(values.originalEstimate * 60) : undefined,
      customFields: customFields.length > 0 ? cleanCustomFields(customFields) : undefined,
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
          queryClient.invalidateQueries({ queryKey: ["gantt-data", workspaceId] });
          queryClient.invalidateQueries({ queryKey: ["issue", String(task._id)] });
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
              queryClient.invalidateQueries({ queryKey: ["gantt-data", workspaceId] });
            } catch (error) {
              console.error("Failed to move item column after task update:", error);
              queryClient.invalidateQueries({ queryKey: ["all-tasks", "kanban"] });
              queryClient.invalidateQueries({ queryKey: ["gantt-data", workspaceId] });
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
            {/* Custom Fields Toolbar */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CustomFieldTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTopToolbarClick(type)}
                  className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm capitalize"
                >
                  {type}
                </button>
              ))}
            </div>

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

            {/* Custom Fields Rendering */}
            <div className="space-y-2" ref={customFieldsSectionRef}>
              <div className="space-y-2">
                {customFields.map((f, idx) => {
                  const isNew = (f.name === '' || newlyAddedIndex === idx);
                  const key = f.id || `${f.fieldType}-${idx}`;
                  return (
                    <div key={key} className="space-y-2 p-3 border rounded-md bg-white dark:bg-card relative group">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium flex items-center gap-2 flex-1">
                          {f.isEditing !== false ? (
                            <div className="flex items-center gap-2">
                              <input
                                ref={(el) => { if (newlyAddedIndex === idx) newFieldNameRef.current = el; }}
                                placeholder="Field name"
                                value={f.name}
                                onChange={(e) => setCustomFields((s) => { const c = [...s]; c[idx] = { ...c[idx], name: e.target.value }; return c; })}
                                className="px-2 py-1 border rounded bg-background text-foreground border-input w-full max-w-[200px]"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomFields((s) => { const c = [...s]; c[idx] = { ...c[idx], isEditing: false }; return c; })}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded"
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <>{f.name}</>
                          )}
                        </div>
                        <button type="button" className="text-red-500 text-xs ml-2" onClick={() => removeCustomField(idx)}>Remove</button>
                      </div>
                      <div>
                        {(f.fieldType === 'dropdown' || f.fieldType === 'multi-select') && f.isEditing !== false && (
                          <div className="mb-3 p-2 bg-muted/50 rounded border border-dashed border-border">
                            <div className="text-xs font-medium mb-1 text-muted-foreground">Add Options</div>
                            <div className="flex gap-2 mb-2">
                              <input
                                placeholder="Type option & press Enter"
                                className="flex-1 px-2 py-1 text-xs border rounded bg-background text-foreground border-input"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                      setCustomFields(s => {
                                        const c = [...s];
                                        const opts = c[idx].options || [];
                                        if (!opts.includes(val)) {
                                          c[idx] = { ...c[idx], options: [...opts, val] };
                                        }
                                        return c;
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {f.fieldType === 'text' && (
                          <Input value={f.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter text" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" />
                        )}
                        {f.fieldType === 'number' && (
                          <input type="number" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={f.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value ? Number(e.target.value) : '')} placeholder="Enter number" />
                        )}
                        {f.fieldType === 'dropdown' && (
                          <Select value={f.value ?? ''} onValueChange={(v) => updateCustomFieldValue(idx, v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(f.options || []).map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {f.fieldType === 'multi-select' && (
                          <div className="space-y-1">
                            {(!f.value || f.value.length === 0) && <div className="text-gray-400 text-sm">Select multi</div>}
                            <div className="flex flex-wrap gap-2">
                              {(f.options || []).map((opt: string) => {
                                const selected = Array.isArray(f.value) && f.value.includes(opt);
                                return (
                                  <button key={opt} type="button" onClick={() => {
                                    const arr = Array.isArray(f.value) ? [...f.value] : [];
                                    const i = arr.indexOf(opt);
                                    if (i === -1) arr.push(opt); else arr.splice(i, 1);
                                    updateCustomFieldValue(idx, arr);
                                  }} className={`px-2 py-1 rounded ${selected ? 'bg-primary text-primary-foreground' : 'bg-background border border-input hover:bg-accent hover:text-accent-foreground'}`}>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {f.fieldType === 'checkbox' && (
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={!!f.value} onChange={(e) => updateCustomFieldValue(idx, !!e.target.checked)} />
                            <span className="text-sm">Checked</span>
                          </label>
                        )}
                        {f.fieldType === 'date' && (
                          <input type="date" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={f.value ? new Date(f.value).toISOString().split('T')[0] : ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value ? new Date(e.target.value).toISOString() : '')} />
                        )}
                        {f.fieldType === 'user' && (
                          <Select value={f.userValue ?? f.value ?? ''} onValueChange={(v) => updateCustomFieldValue(idx, v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((m: any) => {
                                const u = m.user || m.userId;
                                const id = u?._id || u || '';
                                const name = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
                                return <SelectItem key={id} value={id}>{name}</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                        )}
                        {f.fieldType === 'url' && (
                          <Input type="url" value={f.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter URL" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div ref={customFieldsSectionRef} />
            </div>

            {/* Assigned To */}
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                      {membersOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getProfileImageUrl(option.profilePicture)} />
                              <AvatarFallback className={getAvatarColor(option.label)}>{getAvatarFallbackText(option.label)}</AvatarFallback>
                            </Avatar>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Due Date */}
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn(
                        "w-full pl-3 text-left font-normal border-gray-300 dark:border-border dark:bg-background dark:text-foreground h-[42px] rounded-lg",
                        !field.value && "text-muted-foreground"
                      )}>
                        {field.value ? format(field.value, "PPP") : "No due date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(e) => {
                        field.onChange(e);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            {/* Parent/Epic Selection */}
            {['story', 'task', 'bug', 'improvement', 'subtask'].includes(String(task.type).toLowerCase()) && (
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
                              .filter((item: any) => ['story', 'task', 'bug', 'improvement'].includes(String(item.type).toLowerCase())).length === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent issue..." />
                          </SelectTrigger>
                          <SelectContent>
                            {((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                              .filter((item: any) => ['story', 'task', 'bug', 'improvement'].includes(String(item.type).toLowerCase())).length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">
                                No parent issues available.
                              </div>
                            ) : (
                              ((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                                .filter((item: any) => ['story', 'task', 'bug', 'improvement'].includes(String(item.type).toLowerCase()) && item._id !== task._id)
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
                    {statusOptions.map((status) => {
                      const colors = getGanttStatusColor(status.value);
                      const StatusIcon = getStatusIcon(status.value);
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            {StatusIcon && <StatusIcon className={`h-4 w-4 ${colors.text}`} />}
                            <span>{status.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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

            {/* Original Estimate (hours) */}
            <FormField control={form.control} name="originalEstimate" render={({ field }) => (
              <FormItem>
                <FormLabel>Original Estimate (hours)</FormLabel>
                <FormControl>
                  <Input type="number" step={0.25} min={0} placeholder="0" value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ===== TIME TRACKING SECTION (8.2) ===== */}
            <div className="border-2 border-blue-300 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">8.2</span>
                <div className="font-bold text-sm text-blue-900 dark:text-blue-100">Time Tracking</div>
              </div>

              {/* Time Tracking Summary */}
              <TimeTrackingSummary
                issue={detailedIssue || task}
                originalEstimate={(detailedIssue as any)?.originalEstimate ?? (task as any)?.originalEstimate}
                remainingEstimate={(detailedIssue as any)?.remainingEstimate ?? (task as any)?.remainingEstimate}
                timeSpent={(detailedIssue as any)?.timeSpent ?? (task as any)?.timeSpent}
                storyPoints={(detailedIssue as any)?.storyPoints ?? (task as any)?.storyPoints}
              />

              {/* Timer Control */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">⏱️ Timer Control</div>
                <TimerButton
                  issueId={String(task._id)}
                  userId={task.assignedTo?._id || (typeof task.assignedTo === 'string' ? task.assignedTo : '')}
                  onTimerStop={() => {
                    queryClient.invalidateQueries({ queryKey: ['issue-logs', String(task._id)] });
                    queryClient.invalidateQueries({ queryKey: ['issue', String(task._id)] });
                  }}
                  onTimerStart={() => {
                    // Optional: invalidate queries to ensure status reflects immediately if needed
                    queryClient.invalidateQueries({ queryKey: ['issue', String(task._id)] });
                  }}
                />
              </div>

              {/* Log Work Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogWorkOpen(true)}
                className="gap-1 w-full"
              >
                📝 Log Work
              </Button>

              {/* Time Logs List */}
              {timeLogs.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">📋 Recent Time Logs ({timeLogs.length})</div>
                  <TimeLogsList
                    logs={timeLogs}
                    isLoading={loadingLogs}
                    currentUserId={task.assignedTo?._id}
                    onLogDeleted={() => {
                      queryClient.invalidateQueries({ queryKey: ['issue-logs', String(task._id)] });
                      queryClient.invalidateQueries({ queryKey: ['issue', String(task._id)] });
                    }}
                    onLogUpdated={() => {
                      queryClient.invalidateQueries({ queryKey: ['issue-logs', String(task._id)] });
                      queryClient.invalidateQueries({ queryKey: ['issue', String(task._id)] });
                    }}
                  />
                </div>
              )}
            </div>

            {/* Story Points */}
            <FormField control={form.control} name="storyPoints" render={({ field }) => (
              <FormItem>
                <FormLabel>Story Points (Optional)</FormLabel>
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select story points" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {[1, 2, 3, 5, 8, 13].map((sp) => (
                      <SelectItem key={sp} value={String(sp)}>{sp}</SelectItem>
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
                      const absoluteUrl = (att.url && att.url.startsWith("http")) ? att.url : `${apiOrigin}${att.url}`;
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

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader className="animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setLogWorkOpen(true)} disabled={isPending}>
                Log Work
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Log Work Dialog */}
      <LogWorkDialog
        isOpen={logWorkOpen}
        onOpenChange={setLogWorkOpen}
        itemId={task._id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['issue-logs', String(task._id)] });
          queryClient.invalidateQueries({ queryKey: ['issue', String(task._id)] });
          queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['workspace-items'] });
        }}
      />
    </div>
  );
}





