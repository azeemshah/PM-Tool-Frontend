import { useEffect, useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useScrumboardAppContext } from '@/contexts/ScrumboardAppContext';
import { useUpdateIssue, useDeleteIssue } from '@/api/issue/hooks';
import { Issue, IssuePriority, IssueStatus } from '@/api/issue/types';
import { ScrumboardCard } from '@/api/scrumboard/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
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
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

export function BoardCardDialog() {
  const {
    selectedCard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    setSelectedCard,
    selectedProjectId,
    setSelectedProjectId,
  } = useScrumboardAppContext();

  const workspaceId = useWorkspaceId();
  const { data: projectsData } = useGetProjectsInWorkspaceQuery({
    workspaceId,
  });
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const { toast } = useToast();

  const members = Array.isArray(membersData) ? membersData : (membersData?.members || []);
  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects ?? (projectsData?.data ?? []));

  // Check if selectedCard is actually an Issue (has 'type' field that's an issue type)
  const isIssue = selectedCard && ('type' in selectedCard) && 
    ['epic', 'story', 'task', 'bug', 'subtask'].includes(String((selectedCard as Record<string, unknown>).type));

  const issue = isIssue ? (selectedCard as Issue) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue?.title || (selectedCard as ScrumboardCard)?.title || '');
  const [description, setDescription] = useState(issue?.description || (selectedCard as ScrumboardCard)?.description || '');
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority || (selectedCard as ScrumboardCard)?.priority || 'medium');
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'to-do');
  const [assigneeId, setAssigneeId] = useState(issue?.assignee?._id || '');
  const [dueDate, setDueDate] = useState<string | null>(issue?.dueDate || null);
  const [projectId, setProjectId] = useState(issue?.projectId || '');

  const { mutate: updateIssue, isPending: isUpdating } = useUpdateIssue();
  const { mutate: deleteIssueApi, isPending: isDeleting } = useDeleteIssue();

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setPriority(issue.priority || 'medium');
      setStatus(issue.status || 'to-do');
      setAssigneeId(issue.assignee?._id || '');
      setDueDate(issue.dueDate || null);
      setProjectId(issue.projectId || '');
    }
  }, [issue]);

  if (!isCardDialogOpen || !issue) {
    return null;
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    updateIssue(
      {
        issueId: issue._id,
        data: {
          title,
          description,
          priority,
          status,
          projectId,
          assignee: assigneeId || undefined,
          dueDate,
        },
      },
      {
        onSuccess: (updatedIssue: Issue) => {
          // Update selected project if the project changed
          if (projectId !== selectedProjectId) {
            setSelectedProjectId(projectId);
          }
          // Update context with the new issue data
          setSelectedCard(updatedIssue);
          
          // Also update local state with the returned data to immediately reflect changes
          setTitle(updatedIssue.title);
          setDescription(updatedIssue.description || '');
          setPriority(updatedIssue.priority || 'medium');
          setStatus(updatedIssue.status || 'to-do');
          setAssigneeId(updatedIssue.assignee?._id || '');
          setDueDate(updatedIssue.dueDate || null);
          setProjectId(updatedIssue.projectId || '');
          
          setIsEditing(false);
          toast({
            title: 'Success',
            description: 'Issue updated successfully',
          });
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
      { issueId: issue._id },
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Issue Details</h2>
            <p className="text-sm text-gray-500 mt-1">{issue.key || `${issue.type} #${issue._id.slice(-6)}`}</p>
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
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
          </div>

          {/* Issue Type and Key */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              {isEditing ? (
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects && projects.length > 0 ? (
                      projects.map((project: any) => (
                        <SelectItem key={project._id} value={project._id}>
                          <div className="flex items-center gap-2">
                            <span>{project.emoji || '📁'}</span>
                            <span>{project.name || project.projectName}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No projects available</div>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-600">
                  {projects?.find((p: any) => p._id === projectId)?.name || projects?.find((p: any) => p._id === projectId)?.projectName || 'Unknown'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Badge className="inline-block p-1 px-2 gap-1 font-medium shadow-sm capitalize">
                {issue.type}
              </Badge>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {description || 'No description'}
              </p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-600">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            {isEditing ? (
              <Select value={assigneeId || 'unassigned'} onValueChange={(value) => setAssigneeId(value === 'unassigned' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <div className="w-full max-h-[200px] overflow-y-auto">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members && members.length > 0 ? (
                      members.map((member: Record<string, unknown>) => {
                        const userId = member.userId as Record<string, unknown>;
                        if (!userId) return null;
                        const name = (userId.name as string) || 'Unknown';
                        const userId_id = String(userId._id || '');
                        const initials = getAvatarFallbackText(name);
                        const avatarColor = getAvatarColor(initials || 'NA');
                        return (
                          <SelectItem
                            key={userId_id}
                            value={userId_id}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={(userId.profilePicture as string) || ''} alt={name} />
                                <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                              </Avatar>
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No members available</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            ) : (() => {
              // Find assignee details from members list if assignee ID exists
              const assigneeIdToCheck = assigneeId || issue.assignee?._id || (typeof issue.assignee === 'string' ? issue.assignee : null);
              if (assigneeIdToCheck) {
                const assigneeMember = members.find((member: Record<string, unknown>) => {
                  const userId = member.userId as Record<string, unknown>;
                  return String(userId?._id) === String(assigneeIdToCheck);
                });
                
                if (assigneeMember) {
                  const userId = assigneeMember.userId as Record<string, unknown>;
                  const name = (userId.name as string) || 'Unknown';
                  const initials = getAvatarFallbackText(name);
                  const avatarColor = getAvatarColor(initials || 'NA');
                  
                  return (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(userId.profilePicture as string) || ''} alt={name} />
                        <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{name}</span>
                    </div>
                  );
                }
              }
              
              // Fallback for API-returned assignee data
              if (issue.assignee && (typeof issue.assignee === 'object') && 'name' in issue.assignee && (issue.assignee as any).name) {
                const assigneeObj = issue.assignee as any;
                const name = assigneeObj.name || 'Unknown';
                const initials = getAvatarFallbackText(name);
                const avatarColor = getAvatarColor(initials || 'NA');
                
                return (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={assigneeObj.email || assigneeObj.profilePicture || ''} alt={name} />
                      <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-gray-900">{name}</span>
                  </div>
                );
              }
              
              return <span className="text-gray-400">Unassigned</span>;
            })()
            }
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm text-gray-700">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Updated</p>
              <p className="text-sm text-gray-700">
                {issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Comments Count */}
          {issue.comments && issue.comments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments ({issue.comments.length})
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {issue.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-700">
                      {comment.author?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="p-6 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
