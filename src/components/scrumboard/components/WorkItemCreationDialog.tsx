import React, { useRef, useState } from 'react';
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
import { CreateItemDto, ItemPriority, ItemStatus, ItemType } from '@/api/issue/types';
import { ISSUE_TYPES_LIST } from '@/components/issue/constants';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { Download, Trash2 } from 'lucide-react';
import { uploadWorkItemAttachment } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

const workItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['Task', 'Bug', 'Story', 'Epic']).default('Task'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.string().min(1, 'Status is required'),
  reporterId: z.string().min(1, 'Reporter is required'),
  dueDate: z.string().optional(),
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
  const [attachments, setAttachments] = useState<{ file: File; url: string; name: string }[]>([]);
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
      dueDate: '',
    },
  });

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
        dueDate: data.dueDate ? new Date(data.dueDate + 'T00:00:00').toISOString() : undefined,
        column: listId || undefined, // Pass the column ID (listId) so it gets assigned to the correct column/status
      };

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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status dropdown is hidden in scrum board since status is determined by sprint column */}

            <FormField
              control={form.control}
              name="reporterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reporter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="w-full max-h-[250px] overflow-y-auto">
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
                  if (files.length > 0) {
                    const entries = files.map((f) => ({
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
