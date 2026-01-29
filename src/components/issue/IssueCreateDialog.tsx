import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, Download } from 'lucide-react';
import { IssueTypeSelector } from './IssueTypeSelector';
import { ParentSelector } from './ParentSelector';
import { IssueType, IssuePriority, ItemStatus, ItemType, ItemPriority, CreateItemDto, TaskType } from '@/api/issue/types';
import {
    useCreateEpic,
    useGetEpics,
} from '@/api/issue/hooks';
import { useToast } from '@/hooks/use-toast';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { getAllAttachments, uploadWorkItemAttachment } from '@/lib/api';

interface IssueCreateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    onSuccess?: () => void;
    defaultType?: IssueType;
}

const PRIORITIES: IssuePriority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

export function IssueCreateDialog({
    isOpen,
    onOpenChange,
    workspaceId,
    onSuccess,
    defaultType,
}: IssueCreateDialogProps) {
    const queryClient = useQueryClient();

    // Form state
    const [issueType, setIssueType] = useState<IssueType | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<IssuePriority>('medium');
    const [epicId, setEpicId] = useState('');
    const [parentIssueId, setParentIssueId] = useState('');
    const [reporterId, setReporterId] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [status, setStatus] = useState('');
    type LocalAttachment = { file: File; url: string; name: string };
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { statuses: dynamicStatuses, isLoading: isLoadingStatuses } = useGetWorkspaceStatuses(workspaceId);

    // Queries and mutations
    const membersQuery = useGetWorkspaceMembers(workspaceId);
    const epicsQuery = useGetEpics(workspaceId || null);
    const workspaceItemsQuery = useQuery({
        queryKey: ['workspace-items', workspaceId],
        queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
        enabled: !!workspaceId,
        staleTime: 5 * 60 * 1000,
    });

    // Normalize responses: some hooks return an array directly, others return an object with a `members`/`roles` shape
    const members = Array.isArray(membersQuery.data) ? membersQuery.data : (membersQuery.data?.members ?? []);
    const epics = Array.isArray(epicsQuery.data) ? epicsQuery.data : (epicsQuery.data ?? []);
    
    // Handle workspaceItems: could be array or { data: [], meta: ... }
    const workspaceItemsRaw = workspaceItemsQuery.data as any;
    const workspaceItems = Array.isArray(workspaceItemsRaw) 
        ? workspaceItemsRaw 
        : (workspaceItemsRaw?.data || []);

    // Debug logging
    console.log('🔍 IssueCreateDialog Debug:', {
        workspaceId,
        epicsQueryKey: ['epics', workspaceId || null],
        epicsQueryLoading: epicsQuery.isLoading,
        epicsQueryError: epicsQuery.error,
        epicsData: epicsQuery.data,
        epics: epics,
        epicCount: epics.length,
        workspaceItemsRaw,
        workspaceItemsCount: workspaceItems.length
    });

    // Format options for reporter display
    const reporterOptions = members.map((member) => {
        if (!member) return { label: 'Unknown', value: '' };

        // Handle both new (user object) and old (userId object) structures
        const userObj = member.user || member.userId;

        // Safety check if userObj is just an ID string or null
        if (!userObj || typeof userObj === 'string') {
             return { 
                 label: <span className="text-muted-foreground">Unknown User</span>, 
                 value: typeof userObj === 'string' ? userObj : "" 
             };
        }

        const name = userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : "Unknown");
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);
        return {
            label: (
                <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={userObj.profilePicture || ''} alt={name} />
                        <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                    </Avatar>
                    <span>{name}</span>
                </div>
            ),
            value: userObj._id || '',
        };
    });

    const { mutate: createEpic, isPending: epicPending } = useCreateEpic();

    const { mutate: createItem, isPending: itemPending } = useMutation({
        mutationFn: ({ data }: { data: CreateItemDto; type: ItemType }) =>
            issueApiService.createItem(data),
        onSuccess: (_item, variables) => {
            queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban'] });
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban', workspaceId] });
            }
            queryClient.invalidateQueries({ queryKey: ['issues'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-items', workspaceId] });
            const typeLabel = variables.type.charAt(0).toUpperCase() + variables.type.slice(1);
            toast({
                title: 'Success',
                description: `${typeLabel} "${variables.data.title}" created successfully`,
            });
        },
        onError: (error: any, variables) => {
            const typeLabel = variables.type.charAt(0).toUpperCase() + variables.type.slice(1);
            const message = error?.response?.data?.message || `Failed to create ${variables.type}`;
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        },
    });

    const { toast } = useToast();

    const isLoading =
        epicPending || itemPending;

    // Refetch issues after creation
    const refetchIssues = () => {
        console.log('🔄 Refetching issues after creation:', {
            workspaceId,
        });
        if (workspaceId) {
            queryClient.invalidateQueries({ queryKey: ['issues'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-issues'] });
        }
    };

    // Reset form when dialog closes or default type changes
    useEffect(() => {
        if (!isOpen) {
            setIssueType(defaultType || '');
            setTitle('');
            setDescription('');
            setPriority('medium');
            setEpicId('');
            setParentIssueId('');
            setReporterId('');
            setDueDate(undefined);
            setStatus('');
            // revoke object URLs
            attachments.forEach(att => URL.revokeObjectURL(att.url));
            setAttachments([]);
        } else {
            // If a default type is provided and no type is selected yet, apply it
            if (defaultType && !issueType) {
                setIssueType(defaultType);
            }
        }
    }, [isOpen, defaultType, issueType]);

    // Set default reporter
    useEffect(() => {
        if (members.length > 0 && !reporterId) {
            const firstMember = members[0];
            const userObj = firstMember.user || firstMember.userId;
            const id = (typeof userObj === 'string' ? userObj : userObj?._id) || '';
            setReporterId(id);
        }
    }, [members, reporterId]);

    const handleCreate = async () => {
        // Validate required fields
        if (!title.trim()) {
            toast({
                title: 'Error',
                description: 'Title is required',
                variant: 'destructive',
            });
            return;
        }

        if (!issueType) {
            toast({
                title: 'Error',
                description: 'Issue type is required',
                variant: 'destructive',
            });
            return;
        }

        if (!reporterId) {
            toast({
                title: 'Error',
                description: 'Reporter is required',
                variant: 'destructive',
            });
            return;
        }

        // Validate parent selections
        const statusMap: Record<string, ItemStatus> = {
            'backlog': 'Backlog',
            'todo': 'To Do',
            'in_progress': 'In Progress',
            'in_review': 'In Review',
            'done': 'Done'
        };

        const mapPriorityToItemPriority = (value: IssuePriority): ItemPriority => {
            if (value === 'lowest') return 'low';
            if (value === 'highest') return 'high';
            if (value === 'low' || value === 'medium' || value === 'high') return value;
            return 'medium';
        };

        if (issueType === 'epic') {
            const mappedPriority = mapPriorityToItemPriority(priority);

            createEpic(
                {
                    workspace: workspaceId,
                    type: 'epic',
                    title: title.trim(),
                    description: description.trim() || undefined,
                    reporter: reporterId,
                    priority: mappedPriority,
                    dueDate: dueDate?.toISOString(),
                    status: status ? (statusMap[status] || status) : undefined,
                },
                {
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
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                }
            );
        } else if (['story', 'task', 'bug'].includes(issueType)) {
            const itemPriority = mapPriorityToItemPriority(priority);

            const data: CreateItemDto = {
                title: title.trim(),
                description: description.trim() || undefined,
                type: issueType as ItemType,
                priority: itemPriority,
                reporter: reporterId,
                dueDate: dueDate?.toISOString(),
                workspace: workspaceId,
                status: status ? (statusMap[status] || status) : undefined,
                parent: epicId || undefined,
            };

            createItem(
                { data, type: issueType as ItemType },
                {
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
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                }
            );
        } else if (issueType === 'subtask') {
            if (!parentIssueId) {
                toast({
                    title: 'Error',
                    description: 'Subtask must be assigned to a parent issue (Story/Task/Bug)',
                    variant: 'destructive',
                });
                return;
            }

            const itemPriority = mapPriorityToItemPriority(priority);

            const data: CreateItemDto = {
                title: title.trim(),
                description: description.trim() || undefined,
                type: 'subtask',
                priority: itemPriority,
                reporter: reporterId,
                dueDate: dueDate?.toISOString(),
                workspace: workspaceId,
                status: status ? (statusMap[status] || status) : undefined,
                parent: parentIssueId,
            };

            createItem(
                { data, type: 'subtask' },
                {
                    onSuccess: async (created: any) => {
                        try {
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
                                // proactively refresh any attachment lists related to this item
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', created._id || 'unknown'] });
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', created._id || 'unknown'] });
                            }
                        } catch (_) { }
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                }
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <DialogHeader>
                    <DialogTitle>Create Issue</DialogTitle>
                    <DialogDescription>
                        Create a new Epic, Story, Task, Bug, or Subtask with the correct hierarchy
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Issue Type Selection */}
                    <IssueTypeSelector
                        value={issueType}
                        onChange={setIssueType}
                        disabled={isLoading}
                    />

                    {/* Parent Selection (based on type) */}
                    {issueType === 'epic' && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                            Epic is a top-level issue with no parent
                        </div>
                    )}

                    {['story', 'task', 'bug'].includes(issueType as string) && (
                        <ParentSelector
                            issueType={issueType}
                            parentId={epicId}
                            onChange={setEpicId}
                            projectId={workspaceId}
                            disabled={isLoading}
                            optional={true}
                        />
                    )}

                    {issueType === 'subtask' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Parent Issue (Story/Task/Bug) *</label>
                            <Select
                                value={parentIssueId}
                                onValueChange={setParentIssueId}
                                disabled={isLoading || workspaceItems.filter((item) => ['story', 'task', 'bug'].includes(item.type)).length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parent issue..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaceItems.filter((item) => ['story', 'task', 'bug'].includes(item.type)).length === 0 ? (
                                        <div className="p-2 text-sm text-gray-500">
                                            No parent issues available. Create a Story, Task, or Bug first.
                                        </div>
                                    ) : (
                                        workspaceItems
                                            .filter((item) => ['story', 'task', 'bug'].includes(item.type))
                                            .map((item) => (
                                                <SelectItem key={item._id} value={item._id}>
                                                    {item.type.toUpperCase()} - {item.title}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                            {workspaceItems.filter((item) => ['story', 'task', 'bug'].includes(item.type)).length === 0 && (
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Create a Story, Task, or Bug first to add subtasks.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            placeholder="Enter issue title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            placeholder="Enter issue description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={4}
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={priority} onValueChange={setPriority as any}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITIES.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Due Date</label>
                        <input
                            type="date"
                            value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                {dynamicStatuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reporter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reporter *</label>
                        <Select value={reporterId} onValueChange={setReporterId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reporter..." />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="w-full max-h-[250px] overflow-y-auto">
                                    {reporterOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Attachments</label>
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
                                disabled={isLoading}
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
                                            >
                                                <Download className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-sm">{fileName}</span>
                                            </a>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type="button"
                                                className="text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAttachments((prev) => {
                                                        const updated = [...prev];
                                                        const removed = updated.splice(idx, 1)[0];
                                                        if (removed?.url) URL.revokeObjectURL(removed.url);
                                                        return updated;
                                                    });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No attachments yet</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create {issueType ? issueType.charAt(0).toUpperCase() + issueType.slice(1) : 'Issue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


