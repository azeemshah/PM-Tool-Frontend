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
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project</option>
                {projects.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    {project.emoji ? `${project.emoji} ${project.name}` : project.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-600">
                {projectId && projects.length > 0
                  ? projects.find((p: any) => p._id === projectId)?.name || 'Unknown Project'
                  : 'No project assigned'}
              </p>
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
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="Epic">Epic</option>
                <option value="User Story">User Story</option>
                <option value="Task">Task</option>
                <option value="SubTask">SubTask</option>
                <option value="Bug">Bug</option>
              </select>
            ) : (
              <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-700">
                {type || 'Not set'}
              </span>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            {isEditing ? (
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            ) : (
              <div>
                {priority && (
                  <span className={`inline-block px-3 py-1 rounded text-white text-sm font-medium ${
                    priority === 'High' ? 'bg-red-500' :
                    priority === 'Medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {priority}
                  </span>
                )}
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
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map((member: any) => (
                  <option key={member.userId._id} value={member.userId._id}>
                    {member.userId?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            ) : selectedCard.assignee ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {selectedCard.assignee.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900">{selectedCard.assignee.name}</span>
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
