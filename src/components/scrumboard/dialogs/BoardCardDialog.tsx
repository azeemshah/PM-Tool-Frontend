import { useEffect, useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useScrumboardAppContext } from '@/contexts/ScrumboardAppContext';
import { useUpdateScrumboardBoardCard } from '@/api/scrumboard/hooks/cards/useUpdateScrumboardBoardCard';
import { useDeleteScrumboardBoardCard } from '@/api/scrumboard/hooks/cards/useDeleteScrumboardBoardCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { priorities } from '@/components/workspace/task/table/data';
import { formatStatusToEnum, getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { TaskPriorityEnum } from '@/constant';

export function BoardCardDialog() {
  const {
    selectedCard,
    selectedBoard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    setSelectedCard,
  } = useScrumboardAppContext();

  const workspaceId = useWorkspaceId();
  const { data: projectsData } = useGetProjectsInWorkspaceQuery({
    workspaceId,
  });
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);

  const projects = projectsData?.projects || [];
  const members = membersData?.members || [];

  // Resolve selectedCard.assignee to a user object when backend returns just an id
  const resolvedAssignee = (() => {
    if (!selectedCard) return null;
    const a = (selectedCard as any).assignee;
    if (!a) return null;
    // if assignee is a string id, try to find matching member
    if (typeof a === 'string') {
      const m = members.find((mem: any) => String(mem.userId?._id) === String(a));
      return m?.userId || null;
    }
    // if assignee is an object, it may already be populated (user object) or wrapped
    if ((a as any).userId) return (a as any).userId;
    return a;
  })();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(selectedCard?.title || '');
  const [description, setDescription] = useState(selectedCard?.description || '');
  const [type, setType] = useState(selectedCard?.type || '');
  const [priority, setPriority] = useState(selectedCard?.priority || '');
  const [assignee, setAssignee] = useState(selectedCard?.assignee?._id || '');
  const [projectId, setProjectId] = useState(
    (selectedCard && (typeof (selectedCard as any).project === 'string' ? (selectedCard as any).project : (selectedCard as any).project?._id)) || ''
  );
  const [dueDate, setDueDate] = useState<string | null>(
    (selectedCard && ((selectedCard as any).dueDate || (selectedCard as any).metadata?.dueDate)) || null
  );

  const { mutate: updateCard, isPending: isUpdating } = useUpdateScrumboardBoardCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteScrumboardBoardCard();

  useEffect(() => {
    if (selectedCard) {
      setTitle(selectedCard.title);
      setDescription(selectedCard.description || '');
      setType(selectedCard.type || '');
      setPriority(selectedCard.priority || '');
      setAssignee(selectedCard.assignee?._id || (selectedCard.assignee as any) || '');
      setProjectId(
        (selectedCard && (typeof (selectedCard as any).project === 'string' ? (selectedCard as any).project : (selectedCard as any).project?._id)) || ''
      );
      setDueDate((selectedCard as any).dueDate || (selectedCard as any).metadata?.dueDate || null);
    }
  }, [selectedCard]);

  const currentProject = projects.find((p: any) => p._id === projectId);

  if (!isCardDialogOpen || !selectedCard || !selectedBoard) {
    return null;
  }

  const handleSave = () => {
    if (!selectedBoard || !selectedCard) return;
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    const updateData = {
      title,
      description,
    };
    
    if (type) (updateData as any).type = type;
    if (priority) (updateData as any).priority = priority;
    if (assignee) (updateData as any).assigneeId = assignee;
    if (projectId) (updateData as any).projectId = projectId;
    // include dueDate (ISO string)
    if (dueDate) (updateData as any).dueDate = dueDate;

    updateCard(
      {
        boardId: selectedBoard._id,
        cardId: selectedCard._id,
        data: updateData,
      },
      {
        onSuccess: (data: any) => {
          // update context selectedCard so UI shows latest fields (project may be string or populated)
          setSelectedCard(data);
          setIsEditing(false);
          toast({
            title: 'Success',
            description: 'Card updated successfully',
          });
        },
        onError: (error: any) => {
          console.error('Update error:', error);
          toast({
            title: 'Error',
            description: error?.response?.data?.message || 'Failed to update card',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedBoard || !selectedCard) return;

    if (confirm('Are you sure you want to delete this card?')) {
      deleteCard(
        {
          boardId: selectedBoard._id,
          cardId: selectedCard._id,
        },
        {
          onSuccess: () => {
            setIsCardDialogOpen(false);
            setSelectedCard(null);
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Card Details</h2>
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

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            {isEditing ? (
              <Select
                value={projectId || ""}
                onValueChange={(value) => setProjectId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <div
                    className="w-full max-h-[200px]
                   overflow-y-auto scrollbar
                  "
                  >
                    {projects.map((project: any) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.emoji ? `${project.emoji} ${project.name}` : project.name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            ) : (
              projectId && projects.length > 0 && currentProject ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{currentProject.emoji || ''}</span>
                  <span className="text-gray-600">{currentProject.name || 'Unknown Project'}</span>
                </div>
              ) : (
                <p className="text-gray-600">No project assigned</p>
              )
            )}
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            {isEditing ? (
              <p className="text-gray-600">
                {selectedCard.createdAt ? new Date(selectedCard.createdAt).toLocaleString() : '—'}
              </p>
            ) : (
              <p className="text-gray-600">{selectedCard.createdAt ? new Date(selectedCard.createdAt).toLocaleString() : 'No date'}</p>
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

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            {isEditing ? (
              <Select
                value={type || ""}
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Subtask">Subtask</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Improvement">Improvement</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className="inline-block p-1 px-2 gap-1 font-medium shadow-sm capitalize">
                {type || 'Not set'}
              </Badge>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            {isEditing ? (
              <Select
                value={priority || ""}
                onValueChange={(value) => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>
                {priority && (() => {
                  const cardPriorityRaw = String(priority || "").trim();
                  const p = priorities.find((pr: any) => {
                    if (!pr) return false;
                    const prVal = String(pr.value || "");
                    const prLabel = String(pr.label || "");
                    if (prVal === cardPriorityRaw) return true;
                    if (prLabel === cardPriorityRaw) return true;
                    if (prVal.toLowerCase() === cardPriorityRaw.toLowerCase()) return true;
                    if (prLabel.toLowerCase() === cardPriorityRaw.toLowerCase()) return true;
                    return false;
                  });

                  if (!p) return (
                    <span className={`inline-block px-3 py-1 rounded text-white text-sm font-medium`}>{priority}</span>
                  );

                  const statusKey = formatStatusToEnum(p.value) as keyof typeof TaskPriorityEnum;
                  const Icon = p.icon;
                  return (
                    <Badge
                      variant={TaskPriorityEnum[statusKey]}
                      className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
                    >
                      {Icon && <Icon className="h-4 w-4 rounded-full text-inherit" />}
                      <span>{p.label}</span>
                    </Badge>
                  );
                })()}
                {!priority && <span className="text-gray-400">Not set</span>}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            {isEditing ? (
              <input
                type="date"
                value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600">{dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</p>
            )}
          </div>

          {/* Labels */}
          {selectedCard.labels && selectedCard.labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCard.labels.map((labelId) => (
                  <span
                    key={labelId}
                    className="px-3 py-1 rounded text-sm text-white bg-blue-500"
                  >
                    {labelId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            {isEditing ? (
              <Select
                value={assignee || ""}
                onValueChange={(value) => setAssignee(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <div
                    className="w-full max-h-[200px]
                   overflow-y-auto scrollbar
                  "
                  >
                    {members.map((member: any) => {
                      const name = member.userId?.name || 'Unknown';
                      const initials = getAvatarFallbackText(name);
                      const avatarColor = getAvatarColor(name);
                      return (
                        <SelectItem
                          key={member.userId._id}
                          value={member.userId._id}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={member.userId?.profilePicture || ""} alt={name} />
                              <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                            </Avatar>
                            <span>{name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                </SelectContent>
              </Select>
            ) : resolvedAssignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolvedAssignee?.profilePicture || ''} alt={resolvedAssignee?.name || 'User'} />
                  <AvatarFallback className={getAvatarColor(resolvedAssignee?.name || '')}>
                    {getAvatarFallbackText(resolvedAssignee?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-900">{resolvedAssignee?.name || 'Assigned'}</span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>

          {/* Comments Count */}
          {selectedCard.comments && selectedCard.comments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments ({selectedCard.comments.length})
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedCard.comments.map((comment) => (
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
