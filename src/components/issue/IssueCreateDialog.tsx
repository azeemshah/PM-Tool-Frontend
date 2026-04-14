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
import { Loader2, Trash2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IssueTypeSelector } from './IssueTypeSelector';
import { ParentSelector } from './ParentSelector';
import { IssueType, IssuePriority, ItemStatus, ItemType, ItemPriority, CreateItemDto, TaskType } from '@/api/issue/types';
import {
    useCreateEpic,
    useGetEpics,
} from '@/api/issue/hooks';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { useToast } from '@/hooks/use-toast';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText, getProfileImageUrl } from '@/lib/helper';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useGetWorkspaceStatuses } from '@/hooks/use-get-workspace-statuses';
import { attachmentApiService } from '@/api/attachment/services';

import { LabelsSelector } from '@/components/kanban/dialogs/LabelsSelector';
import { TagInput } from '@/components/tag/TagInput';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';

interface IssueCreateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    boardId?: string;
    onSuccess?: () => void;
    defaultType?: IssueType;
    boardType?: 'kanban' | 'scrumboard';
}

const PRIORITIES: IssuePriority[] = ['low', 'medium', 'high'];

function CustomFieldDatePicker({ value, onChange }: { value: any, onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);
    const dateValue = value ? new Date(value) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full pl-3 text-left font-normal border rounded bg-background text-foreground border-input",
                        !value && "text-muted-foreground"
                    )}
                >
                    {dateValue ? (
                        format(dateValue, "PPP")
                    ) : (
                        <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(e) => {
                        onChange(e ? e.toISOString() : '');
                        setOpen(false);
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export function IssueCreateDialog({
    isOpen,
    onOpenChange,
    workspaceId,
    boardId,
    onSuccess,
    defaultType,
    boardType = 'kanban',
}: IssueCreateDialogProps) {
    const queryClient = useQueryClient();
    
    // Try to get context if available, but don't fail if not wrapped in provider
    let selectedColumnName: string | null = null;
    let setSelectedColumnName: (name: string | null) => void = () => {};
    
    try {
        const context = useKanbanAppContext();
        selectedColumnName = context.selectedColumnName;
        setSelectedColumnName = context.setSelectedColumnName;
    } catch (e) {
        // Context not available (e.g., when used outside KanbanAppContextProvider)
        // This is OK - just use empty defaults
    }

    const customFieldsSectionRef = React.useRef<HTMLDivElement | null>(null);
    const newFieldNameRef = React.useRef<HTMLInputElement | null>(null);
    const [newlyAddedIndex, setNewlyAddedIndex] = React.useState<number | null>(null);

    // Form state
    const [issueType, setIssueType] = useState<IssueType | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<IssuePriority>('medium');
    const [labels, setLabels] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [epicId, setEpicId] = useState('');
    const [parentIssueId, setParentIssueId] = useState('');
    const [reporterId, setReporterId] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [status, setStatus] = useState('');
    type LocalAttachment = { file: File; url: string; name: string };
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [originalEstimateHours, setOriginalEstimateHours] = useState<number | ''>('');
    const [storyPoints, setStoryPoints] = useState<number | ''>('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    // Custom fields state
    const [customFields, setCustomFields] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { statuses: dynamicStatuses, isLoading: isLoadingStatuses } = useGetWorkspaceStatuses(workspaceId);

    // Fetch boards to support label selection when boardId is not provided
    const { data: boards = [] } = useGetKanbanBoards(workspaceId);
    // Use provided boardId or fall back to the first board in the workspace
    const effectiveBoardId = boardId || (Array.isArray(boards) && boards.length > 0 ? boards[0]._id : undefined);

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
    // Reporter options for select
    const reporterOptions = members.map((m: any) => {
        const userObj = m.user || m.userId;
        if (!userObj) {
            return { label: <span className="text-muted-foreground">Unknown User</span>, value: '' };
        }
        if (typeof userObj === 'string') {
            return { label: <span className="text-muted-foreground">Unknown User</span>, value: userObj };
        }
        const name = userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'Unknown');
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);
        return {
            label: (
                <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={getProfileImageUrl(userObj.profilePicture || userObj.avatar)} alt={name} />
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
            queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
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
            setLabels([]);
            setTags([]);
            setEpicId('');
            setParentIssueId('');
            setReporterId('');
            setDueDate(undefined);
            setStatus('');
            // revoke object URLs
            attachments.forEach(att => URL.revokeObjectURL(att.url));
            setAttachments([]);
            setCustomFields([]);
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

    // Pre-fill status from selected column
    useEffect(() => {
        if (isOpen && selectedColumnName && !status) {
            // Set status to the column name directly since that's what dynamicStatuses uses as values
            setStatus(selectedColumnName);
            // Clear the selectedColumnName after using it
            setSelectedColumnName(null);
        }
    }, [isOpen, selectedColumnName, status, setSelectedColumnName]);

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

    // focus newly added field name input when inserted
    React.useEffect(() => {
        if (newlyAddedIndex === null) return;
        setTimeout(() => {
            try {
                if (newFieldNameRef.current) newFieldNameRef.current.focus();
            } catch (_) {}
            setNewlyAddedIndex(null);
        }, 150);
    }, [newlyAddedIndex]);

    const removeCustomField = (idx: number) => {
        setCustomFields((s) => s.filter((_, i) => i !== idx));
    };

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
                    labels: labels.length > 0 ? labels : undefined,
                            tags: tags.length > 0 ? tags : undefined,
                            customFields: customFields.length > 0 ? customFields.map(f => ({
                                name: f.name,
                                fieldType: f.fieldType,
                                value: f.value,
                                options: f.options,
                                userValue: f.userValue
                            })) : undefined,
                },
                {
                    onSuccess: async (created: any) => {
                        if (attachments.length > 0 && created?._id) {
                            for (const att of attachments) {
                                try {
                                    await attachmentApiService.uploadWorkItemAttachment({ workItemId: created._id, file: att.file });
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
                            setLabels([]);
                        }
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (error: any) => {
                        console.error('Error creating epic:', error);
                        toast({
                            title: 'Error',
                            description: error?.response?.data?.message || 'Failed to create epic',
                            variant: 'destructive',
                        });
                    },
                }
            );
        } else if (['story', 'task', 'bug', 'improvement'].includes(issueType)) {
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
                labels: labels.length > 0 ? labels : undefined,
                    tags: tags.length > 0 ? tags : undefined,
                    customFields: customFields.length > 0 ? customFields.map(f => ({
                        name: f.name,
                        fieldType: f.fieldType,
                        value: f.value,
                        options: f.options,
                        userValue: f.userValue
                    })) : undefined,
            };

            // attach estimates (frontend uses hours input; backend expects minutes)
            if (originalEstimateHours && Number(originalEstimateHours) > 0) {
                (data as any).originalEstimate = Math.round(Number(originalEstimateHours) * 60);
                // remainingEstimate will be calculated server-side from original - timeSpent
            }

            if (storyPoints && Number(storyPoints) > 0) {
                (data as any).storyPoints = Number(storyPoints);
            }

            createItem(
                { data, type: issueType as ItemType },
                {
                    onSuccess: async (created: any) => {
                        if (attachments.length > 0 && created?._id) {
                            for (const att of attachments) {
                                try {
                                    await attachmentApiService.uploadWorkItemAttachment({ workItemId: created._id, file: att.file });
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
                            setLabels([]);
                        }
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (error: any) => {
                        console.error('Error creating item:', error);
                        toast({
                            title: 'Error',
                            description: error?.response?.data?.message || `Failed to create ${issueType}`,
                            variant: 'destructive',
                        });
                    },
                }
            );
        } else if (issueType === 'subtask') {
            if (!parentIssueId) {
                toast({
                    title: 'Error',
                    description: 'Subtask must be assigned to a parent issue (Story/Task/Bug/Improvement)',
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
                labels: labels.length > 0 ? labels : undefined,
                tags: tags.length > 0 ? tags : undefined,
                customFields: customFields.length > 0 ? customFields.map(f => ({
                    name: f.name,
                    fieldType: f.fieldType,
                    value: f.value,
                    options: f.options,
                    userValue: f.userValue
                })) : undefined,
            };

            if (originalEstimateHours && Number(originalEstimateHours) > 0) {
                (data as any).originalEstimate = Math.round(Number(originalEstimateHours) * 60);
            }

            if (storyPoints && Number(storyPoints) > 0) {
                (data as any).storyPoints = Number(storyPoints);
            }

            createItem(
                { data, type: 'subtask' },
                {
                    onSuccess: async (created: any) => {
                        try {
                            if (attachments.length > 0 && created?._id) {
                                for (const att of attachments) {
                                    try {
                                        await attachmentApiService.uploadWorkItemAttachment({ workItemId: created._id, file: att.file });
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
                                setLabels([]);
                                // proactively refresh any attachment lists related to this item
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', created._id || 'unknown'] });
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', created._id || 'unknown'] });
                            }
                        } catch (_) { }
                        refetchIssues();
                        onOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (error: any) => {
                        console.error('Error creating subtask:', error);
                        toast({
                            title: 'Error',
                            description: error?.response?.data?.message || 'Failed to create subtask',
                            variant: 'destructive',
                        });
                    },
                }
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar"
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
                    {/* Top toolbar showing all custom field types (click to add/scroll to add area) */}
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

                    {['story', 'task', 'bug', 'improvement'].includes(issueType as string) && (
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
                            <label className="text-sm font-medium">Parent Issue (Story/Task/Bug/Improvement) *</label>
                            <Select
                                value={parentIssueId}
                                onValueChange={setParentIssueId}
                                disabled={isLoading || workspaceItems.filter((item) => ['story', 'task', 'bug', 'improvement'].includes(item.type)).length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parent issue..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaceItems.filter((item) => ['story', 'task', 'bug', 'improvement'].includes(item.type)).length === 0 ? (
                                        <div className="p-2 text-sm text-gray-500">
                                            No parent issues available. Create a Story, Task, Bug, or Improvement first.
                                        </div>
                                    ) : (
                                        workspaceItems
                                            .filter((item) => ['story', 'task', 'bug', 'improvement'].includes(item.type))
                                            .map((item) => (
                                                <SelectItem key={item._id} value={item._id}>
                                                    {item.type.toUpperCase()} - {item.title}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                            {workspaceItems.filter((item) => ['story', 'task', 'bug', 'improvement'].includes(item.type)).length === 0 && (
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Create a Story, Task, Bug, or Improvement first to add subtasks.
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

                    {/* Custom Fields (placed high in the form) */}
                    <div className="space-y-2">
                        <div className="space-y-2">
                            {customFields.map((f, idx) => {
                                const isNew = (f.name === '' || newlyAddedIndex === idx);
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
                                            <CustomFieldDatePicker 
                                                value={f.value} 
                                                onChange={(val) => updateCustomFieldValue(idx, val)} 
                                            />
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
                                                        const initials = getAvatarFallbackText(name);
                                                        const avatarColor = getAvatarColor(name);

                                                        return (
                                                            <SelectItem key={id} value={id}>
                                                                <div className="flex items-center space-x-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage src={getProfileImageUrl(u?.profilePicture || u?.avatar)} alt={name} />
                                                                        <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
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
                    <div className="space-y-2 flex flex-col">
                        <label className="text-sm font-medium">Due Date</label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal border-gray-300 dark:border-border dark:bg-background dark:text-foreground h-[42px] rounded-lg",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                    disabled={isLoading}
                                >
                                    {dueDate ? (
                                        format(dueDate, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[100]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={(e) => {
                                        setDueDate(e);
                                        setIsCalendarOpen(false);
                                    }}
                                    disabled={(date) =>
                                        date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Status - Only shown for Kanban boards */}
                    {boardType === 'kanban' && (
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
                    )}

                    {/* Labels - Only show if we have a board ID (either prop or inferred) */}
                    {effectiveBoardId && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Labels</label>
                            <LabelsSelector
                                boardId={effectiveBoardId}
                                selectedLabelIds={labels}
                                onChange={setLabels}
                            />
                        </div>
                    )}

                    {/* Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tags</label>
                        <TagInput
                            workspaceId={workspaceId}
                            selectedTags={tags}
                            onTagsChange={setTags}
                            placeholder="Add tags to organize this issue..."
                        />
                    </div>

                        {/* Estimates & Story Points */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Original Estimate (hours)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.25}
                                    value={originalEstimateHours as any}
                                    onChange={(e) => setOriginalEstimateHours(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={isLoading}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Story Points</label>
                                <Select value={storyPoints === '' ? '' : String(storyPoints)} onValueChange={(v) => setStoryPoints(v ? Number(v) : '') as any}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select story points" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1,2,3,5,8,13].map((sp) => (
                                            <SelectItem key={sp} value={String(sp)}>{sp}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                const validFiles = files.filter(f => {
                                    if (f.size > 2 * 1024 * 1024) {
                                        // You might want to show a toast/alert here.
                                        // For now, we'll just skip the file and maybe alert once if any files were skipped?
                                        // But this is inside a map/filter.
                                        // Let's just filter them out.
                                        return false;
                                    }
                                    return true;
                                });
                                
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



