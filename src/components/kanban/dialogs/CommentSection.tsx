import React, { useState } from 'react';
import { useGetComments, useCreateComment, useDeleteComment, useUpdateComment } from '@/api/comment/hooks';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/api/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Edit2, Trash2, X, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

interface CommentSectionProps {
  workItemId: string;
  reporter?: {
    _id: string;
    name: string;
    profilePicture?: string | null;
  };
}

export function CommentSection({ workItemId }: CommentSectionProps) {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const { data: comments, isLoading } = useGetComments(workItemId);
  const { mutate: createComment, isPending: isCreating } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const currentUserId = user?.id || user?._id;

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    if (editingCommentId) {
      updateComment(
        { id: editingCommentId, data: { content: newComment } },
        {
          onSuccess: () => {
            setEditingCommentId(null);
            setNewComment('');
            queryClient.invalidateQueries({ queryKey: ['comments', workItemId] });
          },
        }
      );
    } else {
      createComment(
        { workItemId, content: newComment, userId: currentUserId },
        {
          onSuccess: (data) => {
            setNewComment('');
            queryClient.setQueryData(['comments', workItemId], (old: any) => {
              const prev = Array.isArray(old) ? old : [];
              const next = [
                {
                  _id: String((data as any)?._id || Date.now()),
                  workItem: workItemId,
                  content: data?.content ?? newComment,
                  userId: user, // Use full user object for immediate display
                  createdAt: (data as any)?.createdAt ?? new Date().toISOString(),
                  updatedAt: (data as any)?.updatedAt ?? new Date().toISOString(),
                },
                ...prev,
              ];
              return next;
            });
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setNewComment('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(id);
    }
  };

  const startEdit = (comment: any) => {
    setEditingCommentId(comment._id);
    setNewComment(comment.content);
  };

  const getUserName = (u: any) => {
    if (!u) return 'Unknown User';
    // Handle case where populate hasn't happened yet or failed (u is just ID)
    if (typeof u === 'string') return 'Unknown User';

    if (u.name) return u.name;
    if (u.username) return u.username;
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return 'Unknown User';
  };

  if (isLoading && !comments) {
    return <div className="py-4 text-center text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-6 pt-6 border-t dark:border-border">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-foreground">
        <MessageSquare className="w-5 h-5" />
        <h3>Comments</h3>
      </div>

      {/* Add Comment Input */}
      <div className="flex gap-4">
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={user?.profilePicture || undefined} />
          <AvatarFallback className={getAvatarColor(getUserName(user))}>{getAvatarFallbackText(getUserName(user))}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={editingCommentId ? "Edit your comment..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-y bg-white dark:bg-muted/30"
          />
          {(newComment || editingCommentId) && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
                size="sm"
              >
                {editingCommentId ? (isUpdating ? 'Updating...' : 'Update') : (isCreating ? 'Saving...' : 'Save')}
              </Button>
              {editingCommentId && (
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments?.map((comment) => (
          <div key={comment._id} className="flex gap-4 group">
            <Avatar className="w-8 h-8 mt-1">
              <AvatarImage src={comment.userId?.profilePicture} />
              <AvatarFallback className={getAvatarColor(getUserName(comment.userId))}>{getAvatarFallbackText(getUserName(comment.userId))}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-foreground">
                    {getUserName(comment.userId)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Actions */}
                {(currentUserId === comment.userId?._id) && !editingCommentId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => startEdit(comment)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(comment._id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
