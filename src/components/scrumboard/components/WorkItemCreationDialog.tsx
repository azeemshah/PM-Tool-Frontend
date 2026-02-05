import React, { useRef, useState, useEffect } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { CreateItemDto, ItemPriority, ItemStatus, ItemType } from '@/api/issue/types';
import { ISSUE_TYPES_LIST } from '@/components/issue/constants';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { Download, Trash2 } from 'lucide-react';
import { uploadWorkItemAttachment } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { LabelsSelector } from '@/components/kanban/dialogs/LabelsSelector';
import { TagInput } from '@/components/tag/TagInput';

const workItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['Task', 'Bug', 'Story', 'Epic']).default('Task'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.string().min(1, 'Status is required'),
  reporterId: z.string().min(1, 'Reporter is required'),
  dueDate: z.date().optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  originalEstimate: z.string().or(z.number()).optional(),
  storyPoints: z.string().or(z.number()).optional(),
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customFieldsSectionRef = useRef<HTMLDivElement | null>(null);
  const newFieldNameRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<{ file: File; url: string; name: string }[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);

  const CustomFieldTypes = ['text', 'number', 'dropdown', 'multi-select', 'checkbox', 'date', 'user', 'url'];

  const handleTopToolbarClick = (type: string) => {
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

  const removeCustomField = (index: number) => {
    setCustomFields((s) => s.filter((_, i) => i !== index));
  };

  const updateCustomFieldValue = (index: number, value: any) => {
    setCustomFields((s) => {
        const c = [...s];
        c[index] = { ...c[index], value };
        return c;
    });
  };

  const { statuses } = useGetWorkspaceStatuses(workspaceId);
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = Array.isArray(memberData) ? memberData : (memberData?.members || []);
  const statusOptions = [
    { label: 'Backlog', value: 'Backlog' },
    ...((statuses || []).filter((s) => s.value && String(s.value).toLowerCase() !== 'backlog'))
  ];

  // Format options for reporter display
  const reporterOptions = members
    .filter((member) => {
      if (!member) return false;
      const userObj = member.user || member.userId;
      return userObj && (typeof userObj === 'string' ? userObj : userObj._id);
    })
    .map((member) => {
      const userObj = member.user || member.userId;
      const userId = typeof userObj === 'string' ? userObj : userObj?._id;
      if (!userId) return null;

      const name = typeof userObj === 'string'
        ? 'Unknown'
        : (userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'Unknown'));

      const initials = getAvatarFallbackText(name);
      const avatarColor = getAvatarColor(name);
      const profilePicture = typeof userObj === 'string' ? undefined : userObj.profilePicture;

      return {
        label: (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profilePicture || ''} alt={name} />
              <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
            </Avatar>
            <span>{name}</span>
          </div>
        ),
        value: userId,
        name,
      };
    })
    .filter(Boolean);
  const form = useForm<WorkItemFormData>({
    resolver: zodResolver(workItemSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'Task',
      priority: 'Medium',
      status: 'Backlog',
      reporterId: reporterOptions?.[0]?.value || '',
      dueDate: undefined,
      labels: [],
      tags: [],
      originalEstimate: '',
      storyPoints: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setCustomFields([]);
      setNewlyAddedIndex(null);
      attachments.forEach(att => URL.revokeObjectURL(att.url));
      setAttachments([]);
    }
  }, [open, form]);

  const createWorkItemMutation = useMutation({
    mutationFn: (data: CreateItemDto) => issueApiService.createItem(data),
    onSuccess: async (created: any) => {
      if (attachments.length > 0 && created?._id) {
        for (const att of attachments) {
          try {
            await uploadWorkItemAttachment({ workItemId: created._id, file: att.file });
          } catch (e: any) {
            toast({
              title: 'Error',
              description: e?.response?.data?.message || 'Failed to upload attachment',
              variant: 'destructive',
            });
          }
        }
        attachments.forEach(att => URL.revokeObjectURL(att.url));
        setAttachments([]);
      }
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
        status: (data.status as ItemStatus),
        reporter: data.reporterId,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        column: listId || undefined, // Pass the column ID (listId) so it gets assigned to the correct column/status
        labels: data.labels && data.labels.length > 0 ? data.labels : undefined,
        tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
        customFields: customFields.length > 0 ? customFields.map(f => ({
          name: f.name,
          fieldType: f.fieldType,
          value: f.value,
          options: f.options,
          userValue: f.userValue
        })) : undefined,
      };

      if (data.originalEstimate && Number(data.originalEstimate) > 0) {
        (payload as any).originalEstimate = Math.round(Number(data.originalEstimate) * 60);
      }

      if (data.storyPoints && Number(data.storyPoints) > 0) {
        (payload as any).storyPoints = Number(data.storyPoints);
      }

      await createWorkItemMutation.mutateAsync(payload);
    } catch (error) {
      // Error handled in onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>
            Add a new work item to your backlog for sprint planning.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
                {/* Top toolbar showing all custom field types */}
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {CustomFieldTypes.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => handleTopToolbarClick(t)}
                            className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm"
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

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

            {/* Custom Fields (placed after description) */}
            <div className="space-y-2">
                <div className="space-y-2">
                    {customFields.map((f, idx) => {
                        return (
                        <div key={f.id || `${f.fieldType}-${idx}`} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium flex items-center gap-2 flex-1">
                                    {f.isEditing !== false ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={(el) => { if (newlyAddedIndex === idx) newFieldNameRef.current = el; }}
                                                placeholder="Field name"
                                                value={f.name}
                                                onChange={(e) => setCustomFields((s) => { const c=[...s]; c[idx]={...c[idx], name: e.target.value}; return c; })}
                                                className="px-2 py-1 border rounded bg-background text-foreground border-input w-full max-w-[200px]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCustomFields((s) => { const c=[...s]; c[idx]={...c[idx], isEditing: false}; return c; })}
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
                                    <Input value={f.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter text" />
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
                                    <Input type="url" value={f.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter URL" />
                                )}
                            </div>
                        </div>
                    )})}
                </div>
                <div ref={customFieldsSectionRef} />
            </div>

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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
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
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(e) => {
                          field.onChange(e);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) =>
                          date > new Date("2100-12-31")
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

            {/* Labels */}
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <FormControl>
                    <LabelsSelector
                      boardId={boardId}
                      selectedLabelIds={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
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
                      placeholder="Add tags to organize this issue..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Estimate (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value)} value={String(field.value || '')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select story points" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 5, 8, 13].map((sp) => (
                          <SelectItem key={sp} value={String(sp)}>
                            {sp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status dropdown is hidden in scrum board since status is determined by sprint column */}

            <FormField
              control={form.control}
              name="reporterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reporter</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'unassigned' ? '' : value)} value={field.value || 'unassigned'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="w-full max-h-[250px] overflow-y-auto scrollbar">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {reporterOptions.map((option: any) => (
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

            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024);

                  if (files.length !== validFiles.length) {
                    alert('Some files were skipped because they exceed the 2MB limit.');
                  }

                  if (validFiles.length > 0) {
                    const entries = validFiles.map((f) => ({
                      file: f,
                      url: URL.createObjectURL(f),
                      name: f.name
                    }));
                    setAttachments((prev) => [...prev, ...entries]);
                  }
                  if (e.target) e.target.value = '';
                }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </Button>
                {attachments.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {attachments.length} file{attachments.length > 1 ? 's' : ''} selected
                  </span>
                )}
                <span className="text-xs text-gray-500">Max size: 2MB</span>
              </div>
              {attachments.length > 0 ? (
                <div className="text-xs text-gray-500">
                  {attachments.map((att, idx) => {
                    const fileName = att.name || `Attachment ${idx + 1}`;
                    return (
                      <div
                        key={`${att.name}-${idx}`}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded-md cursor-pointer"
                        onClick={() => window.open(att.url, '_blank', 'noopener')}
                      >
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline truncate flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm">{fileName}</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachments((prev) => prev.filter((x) => x !== att));
                            URL.revokeObjectURL(att.url);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No attachments yet</p>
              )}
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
