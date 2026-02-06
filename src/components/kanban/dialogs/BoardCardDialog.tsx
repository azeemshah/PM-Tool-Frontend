import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Edit2, Trash2, CalendarIcon } from 'lucide-react';
import { useKanbanAppContext } from '@/contexts/KanbanAppContext';
import { useUpdateIssue, useDeleteIssue } from '@/api/issue/hooks';
import { Issue, IssuePriority, IssueStatus } from '@/api/issue/types';
import { KanbanCard } from '@/api/kanban/types';
import { useGetKanbanBoardLists } from '@/api/kanban/hooks/lists/useGetKanbanBoardLists';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { useGetKanbanBoards } from '@/api/kanban/hooks/boards/useGetKanbanBoards';
import { issueApiService } from '@/api/issue/services/issueApiService';
import API from '@/lib/axios-client';
import { uploadWorkItemAttachment, deleteAttachmentById, deleteAttachmentByUrl, getWorkItemAttachments } from '@/lib/api';
import { getCurrentUserQueryFn } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarColor, getAvatarFallbackText, mapColumnToStatus } from '@/lib/helper';

import { ParentSelector } from '@/components/issue/ParentSelector';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { CommentSection } from './CommentSection';
import { TimerButton } from '@/components/time-tracking/TimerButton';
import { TimeLogsList } from '@/components/time-tracking/TimeLogsList';
import { TimeTrackingSummary } from '@/components/time-tracking/TimeTrackingSummary';
import { LabelsSelector } from './LabelsSelector';
import { TagInput } from '@/components/tag/TagInput';

export function BoardCardDialog() {
  const {
    selectedCard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    setSelectedCard,
  } = useKanbanAppContext();
  const workspaceId = useWorkspaceId();
  const { boardId: routeBoardId } = useParams<{ boardId: string }>();

  // Get boards to fallback if route/card doesn't provide one
  const { data: boards = [] } = useGetKanbanBoards(workspaceId);
  const defaultBoardId = boards.length > 0 ? boards[0]._id : '';

  // Determine boardId from route or selected card
  const boardId = routeBoardId || (selectedCard && 'board' in selectedCard ?
    (typeof (selectedCard as any).board === 'object' ? (selectedCard as any).board?._id : (selectedCard as any).board)
    : '') || defaultBoardId;

  const { data: boardLists } = useGetKanbanBoardLists(boardId || null);
  const { data: boardLabels = [] } = useGetKanbanBoardLabels(boardId || '');

  const queryClient = useQueryClient();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const { toast } = useToast();
  const { data: currentUserData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserQueryFn,
  });

  const currentUserId = currentUserData?.user?._id || '';

  const members = Array.isArray(membersData) ? membersData : (membersData?.members || []);

  // Check if selectedCard is actually an Issue (has 'type' field that's an issue type)
  const isIssue = selectedCard && ('type' in selectedCard) &&
    ['epic', 'story', 'task', 'bug', 'improvement', 'subtask'].includes(String((selectedCard as any).type));

  const issue = isIssue ? (selectedCard as Issue) : null;

  // Helper to get assignee info safely from either issue.assignee or issue.assignedTo
  const getAssigneeInfo = (i: any) => {
    if (!i) return { id: '', name: '' };

    // Check assignee field
    if (i.assignee) {
      // If it's a valid object with ID
      if (typeof i.assignee === 'object') {
        const id = i.assignee._id || i.assignee.id;
        const name = i.assignee.name;

        // If we have both ID and Name, return them
        if (id && name) return { id, name };

        // If we only have ID (or name is missing/undefined), try to look up in members
        if (id) {
          const member = members.find((m: any) => {
            const u = m.user || m.userId;
            return (u?._id === id || u === id);
          });
          if (member) {
            const u = member.user || member.userId;
            const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
            return { id, name: n };
          }
          // If member not found, return ID as fallback or empty name
          return { id, name: name || 'Unknown' };
        }
      }

      // If it's a string ID
      if (typeof i.assignee === 'string') {
        const id = i.assignee;
        const member = members.find((m: any) => {
          const u = m.user || m.userId;
          return (u?._id === id || u === id);
        });
        if (member) {
          const u = member.user || member.userId;
          const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
          return { id, name: n };
        }
        return { id, name: 'Unknown' };
      }
    }

    // Check assignedTo field
    if (i.assignedTo) {
      if (typeof i.assignedTo === 'object') {
        const id = i.assignedTo._id || i.assignedTo.id;
        const name = i.assignedTo.name;
        if (id && name) return { id, name };
        if (id) {
          const member = members.find((m: any) => {
            const u = m.user || m.userId;
            return (u?._id === id || u === id);
          });
          if (member) {
            const u = member.user || member.userId;
            const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
            return { id, name: n };
          }
          return { id, name: name || 'Unknown' };
        }
      }
      if (typeof i.assignedTo === 'string') {
        const id = i.assignedTo;
        const member = members.find((m: any) => {
          const u = m.user || m.userId;
          return (u?._id === id || u === id);
        });
        if (member) {
          const u = member.user || member.userId;
          const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
          return { id, name: n };
        }
        return { id, name: 'Unknown' };
      }
    }

    return { id: '', name: '' };
  };

  // Helper to get reporter info
  const getReporterInfo = (i: any) => {
    if (!i) return { id: '', name: '' };
    if (i.reporter) {
      if (typeof i.reporter === 'object') {
        return { id: i.reporter._id || i.reporter.id || '', name: i.reporter.name || '' };
      }
      if (typeof i.reporter === 'string') {
        const member = members.find((m: any) => {
          const u = m.user || m.userId;
          return (u?._id === i.reporter || u === i.reporter);
        });
        const u = member?.user || member?.userId;
        const n = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unknown');
        return { id: i.reporter, name: n };
      }
    }
    return { id: '', name: '' };
  };

  const initialAssignee = getAssigneeInfo(issue);
  const initialReporter = getReporterInfo(issue);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue?.title || (selectedCard as KanbanCard)?.title || '');
  const [description, setDescription] = useState(
    issue?.description || (selectedCard as KanbanCard)?.description || ''
  );
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority || 'medium');
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'to-do');
  const [assigneeId, setAssigneeId] = useState(initialAssignee.id);
  const [reporterId, setReporterId] = useState(initialReporter.id);
  const [dueDate, setDueDate] = useState<string | null>(issue?.dueDate || null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const getParentId = (item: any) => {
    if (!item) return '';
    if (item.parentIssueId) return item.parentIssueId;
    if (item.epicId) return item.epicId;
    if (item.parent) {
      if (typeof item.parent === 'string') return item.parent;
      if (typeof item.parent === 'object') return item.parent._id || item.parent.id || '';
    }
    return '';
  };

  const getLabelIds = (list: any) => {
    if (!Array.isArray(list)) return [];
    return list.map((l: any) => {
      if (!l) return null;
      if (typeof l === 'string') return l;
      // Handle object with _id or id, ensuring it's a string
      if (typeof l === 'object') {
        const id = l._id || l.id;
        return id ? String(id) : null;
      }
      return null;
    }).filter(Boolean);
  };

  const getTagIds = (list: any) => {
    if (!Array.isArray(list)) return [];
    return list.map((l: any) => {
      if (!l) return null;
      if (typeof l === 'string') return l;
      // Handle object with _id or id, ensuring it's a string
      if (typeof l === 'object') {
        const id = l._id || l.id;
        return id ? String(id) : null;
      }
      return null;
    }).filter(Boolean);
  };

  const [parentId, setParentId] = useState<string>(getParentId(issue));
  const [labels, setLabels] = useState<string[]>(getLabelIds(issue?.labels));
  const [tags, setTags] = useState<string[]>(getTagIds(issue?.tags));
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loadingTimeLogs, setLoadingTimeLogs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom fields state (Edit Mode)
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
  const customFieldsSectionRef = useRef<HTMLDivElement | null>(null);
  const newFieldNameRef = useRef<HTMLInputElement | null>(null);

  const CustomFieldTypes = [
    'text', 'number', 'dropdown', 'multi-select', 'checkbox', 'date', 'user', 'url',
  ];

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

  // focus newly added field name input
  useEffect(() => {
    if (newlyAddedIndex === null) return;
    setTimeout(() => {
      try {
        if (newFieldNameRef.current) newFieldNameRef.current.focus();
      } catch (_) {}
      setNewlyAddedIndex(null);
    }, 150);
  }, [newlyAddedIndex]);

  const { mutate: updateIssue, isPending: isUpdating } = useUpdateIssue();
  const { mutate: deleteIssueApi, isPending: isDeleting } = useDeleteIssue();

  const normalizeStatusForColumn = (value: string | null): IssueStatus => {
    const v = (value || '').toLowerCase().replace(/\s+/g, '_');
    if (v === 'backlog') return 'to-do';
    if (v === 'todo' || v === 'to-do') return 'to-do';
    if (v === 'in_progress' || v === 'in-progress') return 'in-progress';
    if (v === 'in_review' || v === 'in-review' || v === 'review') return 'in-review';
    if (v === 'done') return 'done';
    if (v === 'blocked') return 'blocked';
    return 'to-do';
  };

  const findColumnIdForStatus = (statusValue: IssueStatus): string | null => {
    const lists = boardLists || [];
    if (!lists || lists.length === 0) return null;
    const match = (lists as any[]).find((list) => {
      const name = (list && (list as any).name) || '';
      const mapped = mapColumnToStatus(String(name));
      return mapped === statusValue;
    });
    if (!match) return null;
    const id = (match as any)._id || (match as any).id;
    return id ? String(id) : null;
  };

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setPriority(issue.priority || 'medium');
      setStatus(issue.status || 'to-do');
      setAssigneeId(getAssigneeInfo(issue).id);
      setReporterId(getReporterInfo(issue).id);
      setDueDate(issue.dueDate || null);
      setParentId(getParentId(issue));
      setLabels(getLabelIds(issue.labels));
      setTags(getTagIds(issue.tags));
    }
  }, [issue]);

  const issueIdStr = issue?._id ? String(issue._id) : '';
  const { data: detailedIssue } = useQuery({
    queryKey: ['issue', issueIdStr || 'unknown'],
    queryFn: () => issueApiService.getIssue(issueIdStr),
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });

  // Memoize effective labels map (merging board labels and populated issue labels)
  const effectiveLabelsMap = useMemo(() => {
    const map = new Map<string, any>();
    // Priority 1: Board labels (usually complete)
    boardLabels.forEach((l: any) => map.set(String(l._id || l.id), l));

    // Priority 2: Detailed issue labels (populated)
    if (detailedIssue && Array.isArray(detailedIssue.labels)) {
      detailedIssue.labels.forEach((l: any) => {
        if (typeof l === 'object' && l) {
          const id = String(l._id || l.id);
          if (!map.has(id)) map.set(id, l);
        }
      });
    }
    return map;
  }, [boardLabels, detailedIssue]);

  // Memoize populated tags for preloading
  const populatedTags = useMemo(() => {
    if (!detailedIssue?.tags || !Array.isArray(detailedIssue.tags)) return [];
    return detailedIssue.tags
      .filter((t: any) => t && typeof t === 'object' && (t._id || t.id) && t.name)
      .map((t: any) => ({
        _id: String(t._id || t.id),
        name: t.name
      }));
  }, [detailedIssue]);

  // Sync state with detailedIssue when it loads
  useEffect(() => {
    if (detailedIssue) {
      setTitle(detailedIssue.title);
      setDescription(detailedIssue.description || '');
      setPriority(detailedIssue.priority || 'medium');
      setStatus(detailedIssue.status || 'to-do');
      setAssigneeId(getAssigneeInfo(detailedIssue).id);
      setReporterId(getReporterInfo(detailedIssue).id);
      setDueDate(detailedIssue.dueDate || null);
      setParentId(getParentId(detailedIssue));
      setLabels(getLabelIds(detailedIssue.labels));
      setTags(getTagIds(detailedIssue.tags));
      setCustomFields(detailedIssue.customFields || []);
    }
  }, [detailedIssue]);

  // Custom fields inline editing state
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState<any>(null);

  const getCustomFields = (): any[] => {
    return (detailedIssue?.customFields || (issue as any)?.customFields || []) as any[];
  };

  const startEditField = (field: any) => {
    setEditingFieldName(field?.name || null);
    // prefer userValue id for user picker
    if (field?.fieldType === 'user') setEditingFieldValue(field?.userValue?._id || field?.userValue || field?.value || '');
    else setEditingFieldValue(field?.value ?? '');
  };

  const saveField = async (fieldName: string) => {
    if (!fieldName) return;
    const fields = getCustomFields();
    const idx = fields.findIndex((f) => f.name === fieldName);
    const updated = [...fields];
    if (idx === -1) {
      updated.push({ name: fieldName, fieldType: 'text', value: editingFieldValue });
    } else {
      if (updated[idx].fieldType === 'user') {
        updated[idx].userValue = editingFieldValue || null;
        updated[idx].value = undefined;
      } else {
        updated[idx].value = editingFieldValue;
      }
    }

    // call existing mutation
    try {
      updateIssue({ issueId: String(issue._id), data: { customFields: updated } } as any, {
        onSuccess: () => {
          setEditingFieldName(null);
          setEditingFieldValue(null);
          queryClient.invalidateQueries({ queryKey: ['issue', String(issue._id)] });
        },
      });
    } catch (e) {
      // mutation hook shows toast on error
    }
  };

  // Load time logs
  useEffect(() => {
    const loadTimeLogs = async () => {
      if (!issueIdStr) return;
      try {
        setLoadingTimeLogs(true);
        const logs = await issueApiService.getIssueLogs(issueIdStr);
        setTimeLogs(logs || []);
      } catch (e) {
        // Ignore errors
      } finally {
        setLoadingTimeLogs(false);
      }
    };
    loadTimeLogs();
  }, [issueIdStr]);

  // Debug logging for data flow
  useEffect(() => {
    if (isCardDialogOpen && issue) {
      console.log('BoardCardDialog Debug:', {
        issueId: issue._id,
        detailedIssueId: detailedIssue?._id,
        labelsState: labels,
        tagsState: tags,
        boardLabelsCount: boardLabels.length,
        detailedIssueLabels: detailedIssue?.labels,
        detailedIssueTags: detailedIssue?.tags,
        effectiveLabelsMapSize: effectiveLabelsMap.size,
        populatedTagsCount: populatedTags.length
      });
    }
  }, [isCardDialogOpen, issue, detailedIssue, labels, tags, boardLabels, effectiveLabelsMap, populatedTags]);

  const parentIssueIdStr = getParentId(issue);
  const { data: workItemAttachments = [] } = useQuery({
    queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'],
    queryFn: async () => {
      if (!issueIdStr) return [];
      try {
        const resp = await API.get(`/kanban/files/work-item/${issueIdStr}`);
        const data = resp.data?.data || resp.data || [];
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });
  const { data: workItemAttachmentsFallback = [] } = useQuery({
    queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'],
    queryFn: async () => {
      if (!issueIdStr) return [];
      try {
        const data = await getWorkItemAttachments(issueIdStr);
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!issueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });

  const { data: fetchedParent, isLoading: isParentLoading } = useQuery({
    queryKey: ['issue-parent', parentId],
    queryFn: () => issueApiService.getIssue(parentId),
    enabled: !!parentId && !!isCardDialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: parentAttachments = [] } = useQuery({
    queryKey: ['attachments', 'parent-work-item', parentIssueIdStr || 'none'],
    queryFn: async () => {
      if (!parentIssueIdStr) return [];
      try {
        const resp = await API.get(`/kanban/files/work-item/${parentIssueIdStr}`);
        const data = resp.data?.data || resp.data || [];
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!parentIssueIdStr && !!isCardDialogOpen,
    staleTime: 60 * 1000,
  });

  // Determine the parent object to display (prefer populated data from detailedIssue)
  const parentObject = (() => {
    if (detailedIssue) {
      const p = (detailedIssue as any).parent || (detailedIssue as any).epic;
      // Check if it's a populated object (has title or name)
      if (p && typeof p === 'object' && (p.title || p.name)) {
        return p;
      }
    }
    return fetchedParent;
  })();

  const { data: workspaceItems = [] } = useQuery({
    queryKey: ['workspace-items', workspaceId],
    queryFn: () => issueApiService.getTasksByWorkspace(workspaceId),
    enabled: !!workspaceId && isEditing && issue?.type === 'subtask',
    staleTime: 5 * 60 * 1000,
  });

  const normalize = (list: any[]) =>
    (Array.isArray(list) ? list : []).map((a: any) => ({
      _id: a?._id || a?.id || `${a?.fileUrl || ''}-${a?.fileName || ''}`,
      name: a?.name || a?.fileName || '',
      url: a?.url || a?.fileUrl || '',
    }));
  const fromIssue = normalize(((detailedIssue as any)?.attachments || []));
  const ownAttachments = (() => {
    const seen = new Set<string>();
    const arr = [...normalize(workItemAttachments), ...normalize(workItemAttachmentsFallback), ...fromIssue].filter((a) => {
      const key = a._id || a.url || a.name;
      if (seen.has(String(key))) return false;
      seen.add(String(key));
      return !!(a.url || a.name);
    });
    return arr;
  })();
  const parentOnlyAttachments = (() => {
    const ownKeys = new Set(ownAttachments.map((a) => String(a._id || a.url || a.name)));
    return normalize(parentAttachments).filter((a) => {
      const key = String(a._id || a.url || a.name);
      return !!(a.url || a.name) && !ownKeys.has(key);
    });
  })();

  const buildFullUrl = (url: string) => {
    const base = (API as any)?.defaults?.baseURL || '';
    try {
      return new URL(url, base).toString();
    } catch {
      return `${base}${url}`;
    }
  };
  const toOpenUrl = (fullUrl: string, fileName?: string) => {
    const source = String(fileName || fullUrl).toLowerCase();
    const match = source.match(/\.([a-z0-9]+)(?:$|\?|\#)/);
    const ext = match ? match[1] : '';
    const office = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (office.includes(ext)) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fullUrl)}`;
    }
    return fullUrl;
  };

  useEffect(() => {
    if (detailedIssue) {
      // Sync state with detailed issue if available (it has latest data)
      // Only if not currently editing (to avoid overwriting user changes)
      if (!isEditing) {
        setLabels(getLabelIds(detailedIssue.labels));
        setTags(getTagIds(detailedIssue.tags));
        setParentId(getParentId(detailedIssue));
        setAssigneeId(getAssigneeInfo(detailedIssue).id);
        setCustomFields(detailedIssue.customFields || []);
        // Don't overwrite title/desc/status/priority as they might be handled by optimistic UI or context
      }
    }
  }, [detailedIssue, isEditing]);

  if (!isCardDialogOpen || !issue) {
    return null;
  }

  const reporterObj = (() => {
    const r = (detailedIssue as any)?.reporter ?? (issue as any)?.reporter;
    if (!r) return null;
    if (typeof r === 'object') {
      return {
        _id: String(r._id || r.id || ''),
        name: r.name || 'Unknown',
        profilePicture: r.profilePicture ?? null,
      };
    }
    if (typeof r === 'string') {
      const member = members.find((m: any) => (m.userId?._id === r || m.userId === r));
      return {
        _id: r,
        name: member?.userId?.name || member?.name || 'Unknown',
        profilePicture: member?.userId?.profilePicture ?? null,
      };
    }
    return null;
  })();

  const mapStatusForSprint = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'backlog':
      case 'todo':
      case 'to-do':
        return 'To Do';
      case 'in_progress':
      case 'in-progress':
        return 'In Progress';
      case 'in_review':
      case 'in-review':
      case 'review':
        return 'In Review';
      case 'done':
        return 'Done';
      default:
        return value;
    }
  };

  const mapStatusForApi = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
      case 'to-do':
        return 'Todo';
      case 'in_progress':
      case 'in-progress':
        return 'In Progress';
      case 'in_review':
      case 'in-review':
      case 'review':
        return 'In Review';
      case 'done':
        return 'Done';
      default:
        return undefined;
    }
  };

  const mapPriorityForApi = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    switch (normalized) {
      case 'lowest':
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
      case 'highest':
        return 'high';
      default:
        return undefined;
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    // Check for pending tags
    if (tags.some(t => t.startsWith('temp-'))) {
      toast({
        title: 'Please wait',
        description: 'Tags are still being created. Please try again in a moment.',
        variant: 'default',
      });
      return;
    }

    const normalizedStatus = normalizeStatusForColumn(status);
    const targetColumnId = findColumnIdForStatus(normalizedStatus);
    const issueIdStr = String(issue._id);

    console.log('Update Issue Payload:', {
      issueId: issueIdStr,
      data: {
        title,
        description,
        status: mapStatusForApi(status),
        priority: mapPriorityForApi(priority),
        assignedTo: assigneeId || null,
        dueDate,
        parent: parentId || null,
        labels,
        tags,
        customFields,
      }
    });

    updateIssue(
      {
        issueId: issueIdStr,
        data: {
          title,
          description,
          status: mapStatusForApi(status),
          priority: mapPriorityForApi(priority),
          assignedTo: assigneeId || null,
          dueDate,
          parent: parentId || null,
          labels,
          tags,
          customFields,
        },
      },
      {
        onSuccess: async (updatedIssue: Issue) => {
          setSelectedCard(updatedIssue as any);
          setTitle(updatedIssue.title);
          setDescription(updatedIssue.description || '');
          setPriority(updatedIssue.priority || 'medium');
          setStatus(updatedIssue.status || 'to-do');
          const assignee = updatedIssue.assignee as any;
          setAssigneeId(assignee?._id || assignee || '');
          setDueDate(updatedIssue.dueDate || null);
          setLabels(getLabelIds(updatedIssue.labels || []));
          setTags(getTagIds(updatedIssue.tags || []));
          setIsEditing(false);
          toast({
            title: 'Success',
            description: 'Issue updated successfully',
          });
          queryClient.invalidateQueries({ queryKey: ['issue', issueIdStr] });

          if (workspaceId) {
            const sprintKey = ['workspace-items', workspaceId];
            const mappedSprintStatus = mapStatusForSprint(updatedIssue.status || '');
            queryClient.setQueryData(sprintKey, (old: any[] | undefined) => {
              if (!old) return old;
              return old.map((item: any) => {
                if (String(item._id) === issueIdStr) {
                  return {
                    ...item,
                    title: updatedIssue.title,
                    description: updatedIssue.description || '',
                    priority: updatedIssue.priority || item.priority,
                    status: mappedSprintStatus ?? item.status,
                    assignedTo: updatedIssue.assignee
                      ? {
                        _id: (updatedIssue.assignee as any)._id,
                        name: (updatedIssue.assignee as any).name,
                        profilePicture: (updatedIssue.assignee as any).profilePicture ?? null,
                      }
                      : null,
                    reporter: updatedIssue.reporter
                      ? {
                        _id: (updatedIssue.reporter as any)._id,
                        name: (updatedIssue.reporter as any).name,
                        profilePicture: (updatedIssue.reporter as any).profilePicture ?? null,
                      }
                      : null,
                    dueDate: updatedIssue.dueDate || item.dueDate || null,
                  };
                }
                return item;
              });
            });
            queryClient.invalidateQueries({ queryKey: sprintKey });
          }
          if (targetColumnId && workspaceId) {
            try {
              const queryKey = ['all-tasks', 'kanban', workspaceId || 'unknown'];
              queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((item: any) => {
                  if (String(item._id) === issueIdStr) {
                    return {
                      ...item,
                      column: targetColumnId,
                    };
                  }
                  return item;
                });
              });
              await issueApiService.moveItemToColumn(issueIdStr, targetColumnId);
              queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban'] });
              queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
            } catch (error) {
              console.error('Failed to move issue to column after update:', error);
              queryClient.invalidateQueries({ queryKey: ['all-tasks', 'kanban'] });
              queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
            }
          }
        },
        onError: (error: unknown) => {
          console.error('Update error:', error);
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to update issue';
          toast({
            title: 'Error',
            description: errorMessage || 'Failed to update issue',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    deleteIssueApi(
      issue._id,
      {
        onSuccess: () => {
          setIsCardDialogOpen(false);
          setSelectedCard(null);
          toast({
            title: 'Success',
            description: 'Issue deleted successfully',
          });
        },
        onError: (error: unknown) => {
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to delete issue';
          toast({
            title: 'Error',
            description: errorMessage || 'Failed to delete issue',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-card dark:border-border dark:text-foreground rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-border">
          <div>
            <h2 className="text-xl font-bold dark:text-foreground">Issue Details</h2>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">{issue.key || `${issue.type} #${issue._id.slice(-6)}`}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
            <button
              onClick={() => {
                setIsCardDialogOpen(false);
                setSelectedCard(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-foreground"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Toolbar - Only in Edit Mode */}
          {isEditing && (
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
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">{title}</h3>
            )}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Labels
            </label>
            {isEditing ? (
              <LabelsSelector
                boardId={boardId || ''}
                selectedLabelIds={labels}
                onChange={setLabels}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels && labels.length > 0 ? (
                  labels.map((labelId) => {
                    const label = effectiveLabelsMap.get(labelId);
                    if (!label) {
                      return (
                        <Badge key={labelId} variant="outline" className="text-gray-500 border-dashed">
                          Unknown ({labelId.slice(-4)})
                        </Badge>
                      );
                    }
                    return (
                      <Badge key={labelId} style={{ backgroundColor: label.color }} className="text-white hover:opacity-80">
                        {label.name}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500 italic">No labels</span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <TagInput
              workspaceId={workspaceId}
              selectedTags={tags}
              onTagsChange={isEditing ? setTags : () => { }}
              disabled={!isEditing}
              placeholder={isEditing ? "Add tags..." : "No tags"}
              contentClassName={!isEditing ? "border-none px-0" : ""}
              preloadedTags={populatedTags}
            />
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <Badge className="inline-block p-1 px-2 gap-1 font-medium shadow-sm capitalize">
              {issue.type}
            </Badge>
          </div>

          {/* Parent / Epic */}
          {(['story', 'task', 'bug', 'improvement', 'subtask'].includes(issue.type)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {issue.type === 'subtask' ? 'Parent Issue' : 'Epic'}
              </label>
              {isEditing ? (
                issue.type === 'subtask' ? (
                  <Select
                    value={parentId}
                    onValueChange={setParentId}
                    disabled={
                      ((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                        .filter((item: any) => ['story', 'task', 'bug', 'improvement'].includes(item.type)).length === 0
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent issue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                        .filter((item: any) => ['story', 'task', 'bug'].includes(item.type)).length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">
                          No parent issues available.
                        </div>
                      ) : (
                        ((Array.isArray(workspaceItems) ? workspaceItems : (workspaceItems as any)?.data || []) as any[])
                          .filter((item: any) => ['story', 'task', 'bug'].includes(item.type) && item._id !== issue._id)
                          .map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              <div className="flex items-center gap-2">
                                <IssueTypeIcon type={item.type} />
                                <span>{item.title}</span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <ParentSelector
                    issueType={issue.type}
                    parentId={parentId}
                    onChange={setParentId}
                    projectId={workspaceId}
                    optional={true}
                    showLabel={false}
                  />
                )
              ) : (
                <div className="flex items-center gap-2">
                  {parentId ? (
                    parentObject ? (
                      <div className="flex items-center gap-2 p-1 px-2 border rounded-md bg-gray-50 dark:bg-muted/50">
                        <IssueTypeIcon type={parentObject.type || 'task'} />
                        <span className="text-sm">{parentObject.title || parentObject.name || 'Unknown Parent'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">{isParentLoading ? 'Loading...' : 'Parent not found'}</span>
                    )
                  ) : (
                    <span className="text-gray-500 text-sm italic">None</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardLists && boardLists.length > 0 ? (
                    boardLists.map((list: any) => (
                      <SelectItem key={list._id} value={list.name}>
                        {list.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="capitalize">
                {status?.replace('-', ' ').replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-muted/50 rounded-md text-sm text-gray-700 dark:text-foreground min-h-[100px] whitespace-pre-wrap">
                {description || 'No description provided.'}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div ref={customFieldsSectionRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            </label>

            <div className="space-y-2">
              {(isEditing ? customFields : getCustomFields()).length === 0 && (
                <div className="text-sm text-gray-500 italic"></div>
              )}

              {(isEditing ? customFields : getCustomFields()).map((field: any, idx: number) => {
                const key = field.id || `${String(issue._id)}-cf-${idx}-${field.name}`;
                
                // Read Mode Rendering
                if (!isEditing) {
                   const displayValue = (() => {
                    if (field.fieldType === 'user') {
                      const u = field.userValue || field.value;
                      if (!u) return '—';
                      if (typeof u === 'object') return u.name || `${u.firstName || ''} ${u.lastName || ''}`;
                      return String(u);
                    }
                    if (field.fieldType === 'multi-select' && Array.isArray(field.value)) return field.value.join(', ');
                    if (field.fieldType === 'checkbox') return field.value ? 'Yes' : 'No';
                    if (field.fieldType === 'date' && field.value) return new Date(field.value).toLocaleDateString();
                    return field.value ?? '—';
                  })();
                  return (
                     <div key={key} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 dark:bg-muted/50">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{field.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{displayValue}</div>
                        </div>
                     </div>
                  );
                }

                // Edit Mode Rendering
                const isNew = (field.name === '' || newlyAddedIndex === idx);
                return (
                  <div key={key} className="space-y-2 p-3 border rounded-md bg-white dark:bg-card relative group">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium flex items-center gap-2 flex-1">
                            {field.isEditing !== false ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={isNew ? newFieldNameRef : null}
                                        placeholder="Field name"
                                        value={field.name}
                                        onChange={(e) => {
                                            const copy = [...customFields];
                                            copy[idx] = { ...copy[idx], name: e.target.value };
                                            setCustomFields(copy);
                                        }}
                                        className="px-2 py-1 border rounded bg-background text-foreground border-input w-full max-w-[200px]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = [...customFields];
                                            copy[idx] = { ...copy[idx], isEditing: false };
                                            setCustomFields(copy);
                                        }}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded"
                                    >
                                        Add
                                    </button>
                                </div>
                            ) : (
                                <>{field.name}</>
                            )}
                        </div>
                        <button type="button" className="text-red-500 text-xs ml-2" onClick={() => removeCustomField(idx)}>Remove</button>
                    </div>

                    <div>
                        {(field.fieldType === 'dropdown' || field.fieldType === 'multi-select') && field.isEditing !== false && (
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
                                                    const opts = field.options || [];
                                                    if (!opts.includes(val)) {
                                                        const copy = [...customFields];
                                                        copy[idx] = { ...copy[idx], options: [...opts, val] };
                                                        setCustomFields(copy);
                                                    }
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {field.fieldType === 'text' && (
                            <input className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={field.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter text" />
                        )}
                        {field.fieldType === 'number' && (
                            <input type="number" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={field.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value ? Number(e.target.value) : '')} placeholder="Enter number" />
                        )}
                        {field.fieldType === 'dropdown' && (
                            <Select value={field.value ?? ''} onValueChange={(v) => updateCustomFieldValue(idx, v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(field.options || []).map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {field.fieldType === 'multi-select' && (
                            <div className="space-y-1">
                                {(!field.value || field.value.length === 0) && <div className="text-gray-400 text-sm">Select multi</div>}
                                <div className="flex flex-wrap gap-2">
                                    {(field.options || []).map((opt: string) => {
                                        const selected = Array.isArray(field.value) && field.value.includes(opt);
                                        return (
                                            <button key={opt} type="button" onClick={() => {
                                                const arr = Array.isArray(field.value) ? [...field.value] : [];
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
                        {field.fieldType === 'checkbox' && (
                            <label className="inline-flex items-center gap-2">
                                <input type="checkbox" checked={!!field.value} onChange={(e) => updateCustomFieldValue(idx, !!e.target.checked)} />
                                <span className="text-sm">Checked</span>
                            </label>
                        )}
                        {field.fieldType === 'date' && (
                            <input type="date" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value ? new Date(e.target.value).toISOString() : '')} />
                        )}
                        {field.fieldType === 'user' && (
                            <Select value={field.userValue?._id || field.userValue || field.value || ''} onValueChange={(v) => updateCustomFieldValue(idx, v)}>
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
                        {field.fieldType === 'url' && (
                            <input type="url" className="w-full px-3 py-2 border rounded bg-background text-foreground border-input" value={field.value ?? ''} onChange={(e) => updateCustomFieldValue(idx, e.target.value)} placeholder="Enter URL" />
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              {isEditing ? (
                <Select value={priority} onValueChange={(value) => setPriority(value as IssuePriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowest">Lowest</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="highest">Highest</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">
                  {priority}
                </Badge>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              {isEditing ? (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(new Date(dueDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate ? new Date(dueDate) : undefined}
                      onSelect={(date) => {
                        setDueDate(date ? date.toISOString() : null);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDate(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDate(new Date().toISOString())}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Today
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{dueDate ? format(new Date(dueDate), "PPP") : 'No due date'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reporter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reporter *
            </label>
            {isEditing ? (
              <Select value={reporterId || 'unassigned'} onValueChange={(value) => setReporterId(value === 'unassigned' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reporter" />
                </SelectTrigger>
                <SelectContent>
                  <div className="w-full max-h-[200px] overflow-y-auto">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members && members.length > 0 ? (
                      members.map((member: any) => {
                        const userObj = member.user || member.userId;
                        if (!userObj) return null;
                        const id = userObj._id || (typeof userObj === 'string' ? userObj : '');
                        if (!id) return null;

                        const name = userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'Unknown');
                        return (
                          <SelectItem key={id} value={id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={userObj.profilePicture || ''} />
                                <AvatarFallback className={getAvatarColor(name)}>
                                  {getAvatarFallbackText(name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No members found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {reporterId ? (() => {
                  const reporterName = getReporterInfo(issue).name;
                  const member = members.find((m: any) => {
                    const u = m.user || m.userId;
                    return (u?._id === reporterId || u === reporterId);
                  });
                  const userObj = member?.user || member?.userId;
                  const name = userObj?.name || (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : (reporterName || 'Unknown'));
                  const profilePicture = userObj?.profilePicture;

                  return (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profilePicture || ''} />
                        <AvatarFallback className={getAvatarColor(name)}>
                          {getAvatarFallbackText(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900 dark:text-foreground">{name}</span>
                    </>
                  );
                })() : (
                  <span className="text-gray-500 dark:text-muted-foreground">No reporter</span>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            {isEditing && (
              <div className="flex items-center gap-3 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file || !issueIdStr) return;

                    if (file.size > 2 * 1024 * 1024) {
                      toast({ title: 'Error', description: 'File size must be less than 2MB', variant: 'destructive' });
                      if (e.target) e.target.value = '';
                      return;
                    }

                    setIsUploadingAttachment(true);
                    try {
                      const resp = await uploadWorkItemAttachment({ workItemId: issueIdStr, file });
                      const ok = resp?.success || resp?.url;
                      if (ok) {
                        queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'] });
                        queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'] });
                        toast({ title: 'Success', description: 'Attachment uploaded' });
                      } else {
                        toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
                      }
                    } catch (err) {
                      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
                    } finally {
                      setIsUploadingAttachment(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploadingAttachment}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                >
                  {isUploadingAttachment ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            )}
            <div className="space-y-4">
              {parentOnlyAttachments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Parent attachments</div>
                  {parentOnlyAttachments.map((att: any, idx: number) => {
                    const name = att.name || att.fileName || `Attachment ${idx + 1}`;
                    const url = att.url || att.fileUrl || '';
                    const fullUrlRaw = buildFullUrl(url);
                    const fullUrlWithToken = `${fullUrlRaw}?token=${localStorage.getItem('accessToken') || ''}`;
                    const fullUrl = toOpenUrl(fullUrlWithToken, name);
                    return (
                      <div key={`parent-${idx}`} className="flex items-center gap-2">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {name}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Subtask attachments</div>
                {ownAttachments.length > 0 ? (
                  ownAttachments.map((att: any, idx: number) => {
                    const name = att.name || att.fileName || `Attachment ${idx + 1}`;
                    const url = att.url || att.fileUrl || '';
                    const fullUrlRaw = buildFullUrl(url);
                    const fullUrlWithToken = `${fullUrlRaw}?token=${localStorage.getItem('accessToken') || ''}`;
                    const fullUrl = toOpenUrl(fullUrlWithToken, name);
                    return (
                      <div key={`own-${idx}`} className="flex items-center gap-2">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {name}
                        </a>
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={!!deletingAttachmentId}
                            onClick={async () => {
                              const id = att._id || att.id;
                              const delKey = id ? String(id) : (att.url || att.fileUrl || '');
                              if (!delKey) return;
                              setDeletingAttachmentId(delKey);
                              try {
                                if (id) {
                                  await deleteAttachmentById(String(id));
                                } else if (att.url || att.fileUrl) {
                                  await deleteAttachmentByUrl(String(att.url || att.fileUrl));
                                }
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item', issueIdStr || 'unknown'] });
                                queryClient.invalidateQueries({ queryKey: ['attachments', 'work-item-fallback', issueIdStr || 'unknown'] });
                                toast({ title: 'Deleted', description: 'Attachment removed' });
                              } catch (err) {
                                toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
                              } finally {
                                setDeletingAttachmentId(null);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500">No subtask attachments</div>
                )}
              </div>
            </div>
          </div>

          {/* Time Tracking Section */}
          {!isEditing && issueIdStr && currentUserId && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ⏱️ Time Tracking
              </label>

              <div className="space-y-3">
                {/* Time Tracking Summary */}
                {issue && (
                  <TimeTrackingSummary
                    issue={issue}
                  />
                )}

                {/* Timer Button */}
                <TimerButton
                  issueId={issueIdStr}
                  userId={currentUserId}
                  onTimerStop={() => {
                    queryClient.invalidateQueries({ queryKey: ['issue', issueIdStr] });
                  }}
                />

                {/* Log Work / Time Logs */}
                {timeLogs.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                      Recent Time Logs ({timeLogs.length})
                    </div>
                    <TimeLogsList
                      logs={timeLogs}
                      isLoading={loadingTimeLogs}
                      currentUserId={currentUserId}
                      onLogDeleted={() => {
                        queryClient.invalidateQueries({ queryKey: ['issue', issueIdStr] });
                      }}
                      onLogUpdated={() => {
                        queryClient.invalidateQueries({ queryKey: ['issue', issueIdStr] });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {!isEditing && <CommentSection workItemId={issueIdStr} workspaceId={workspaceId} />}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-6 border-t dark:border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setTitle(issue.title);
                  setDescription(issue.description || '');
                  setPriority(issue.priority || 'medium');
                  setStatus(issue.status || 'to-do');
                  setAssigneeId(issue.assignee?._id || '');
                  setDueDate(issue.dueDate || null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
