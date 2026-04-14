import React, { useState, useMemo } from 'react';
import { useGetComments, useCreateComment, useDeleteComment, useUpdateComment } from '@/api/comment/hooks';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/api/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Edit2, Trash2, Reply, AtSign, Paperclip, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarColor, getAvatarFallbackText, getProfileImageUrl } from '@/lib/helper';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { commentApiService } from '@/api/comment/services/commentApiService';
import API from '@/lib/axios-client';
import { useCommentsSubscription } from '@/hooks/useCommentsSubscription';

interface CommentSectionProps {
  workItemId: string;
  workspaceId: string;
  reporter?: {
    _id: string;
    name: string;
    profilePicture?: string | null;
  };
}

const buildFullUrl = (url: string) => {
  const base = (API as any)?.defaults?.baseURL || '';
  if (!url) return '';
  if (url.startsWith('http')) return url;
  try {
    return new URL(url, base).toString();
  } catch {
    return `${base}${url}`;
  }
};

interface CommentItemProps {
  comment: any;
  currentUserId: string;
  onReply: (commentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (comment: any) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  submitReply: (parentId: string, content: string, attachments?: any[]) => void;
  isCreating: boolean;
  getUserName: (u: any) => string;
  workItemId: string;
  members: any[];
}

const CommentItem = ({ 
  comment, 
  currentUserId, 
  onReply, 
  onDelete, 
  onEdit, 
  replyingTo, 
  setReplyingTo,
  submitReply,
  isCreating,
  getUserName,
  workItemId,
  members
}: CommentItemProps) => {
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<{ fileName: string; fileUrl: string; fileType?: string }[]>([]);
  const [isReplyUploading, setIsReplyUploading] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const replyFileInputRef = React.useRef<HTMLInputElement>(null);

  const insertMention = (memberName: string) => {
    setReplyContent(prev => prev + `@${memberName} `);
    setMentionOpen(false);
  };

  const handleReplyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        setErrorMsg('File size must be less than 2MB');
        if (replyFileInputRef.current) replyFileInputRef.current.value = '';
        return;
      }
      setIsReplyUploading(true);
      try {
        const result = await commentApiService.uploadAttachment(workItemId, file);
        if (result.success || result.url) {
             setReplyAttachments(prev => [...prev, { fileName: result.fileName, fileUrl: result.url, fileType: file.type }]);
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      } finally {
        setIsReplyUploading(false);
        if (replyFileInputRef.current) replyFileInputRef.current.value = '';
      }
    }
  };

  const removeReplyAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() && replyAttachments.length === 0) return;
    submitReply(comment._id, replyContent, replyAttachments);
    setReplyContent('');
    setReplyAttachments([]);
  };

  const resolvedUser = useMemo(() => {
    const userId = comment.userId?._id || (typeof comment.userId === 'string' ? comment.userId : '');
    if (!userId) return comment.userId;
    const found = members.find((u: any) => (u._id === userId || u === userId));
    return found || comment.userId;
  }, [comment.userId, members]);

  return (
    <div className="flex gap-4 group">
      <Avatar className="w-8 h-8 mt-1">
        <AvatarImage src={getProfileImageUrl(resolvedUser?.profilePicture)} />
        <AvatarFallback className={getAvatarColor(getUserName(resolvedUser))}>{getAvatarFallbackText(getUserName(resolvedUser))}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-foreground">
              {getUserName(resolvedUser)}
            </span>
            <span className="text-xs text-gray-500 dark:text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onReply(comment._id)}
              title="Reply"
            >
              <Reply className="w-3 h-3" />
            </Button>
            {(currentUserId === comment.userId?._id) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEdit(comment)}
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-600"
                  onClick={() => onDelete(comment._id)}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {comment.content && (
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
            {comment.content}
          </div>
        )}

        {/* Attachments */}
        {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
                {comment.attachments.map((att: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <Paperclip className="w-3 h-3 text-gray-500" />
                        <a 
                            href={`${buildFullUrl(att.fileUrl)}?token=${localStorage.getItem('accessToken') || ''}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {att.fileName}
                        </a>
                    </div>
                ))}
            </div>
        )}

        {/* Reply Input */}
        {replyingTo === comment._id && (
          <div className="mt-2 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm bg-white dark:bg-muted/30"
              autoFocus
            />
            {errorMsg && (
              <div className="text-xs text-red-500 mt-2">{errorMsg}</div>
            )}
            {/* Reply Attachment Preview */}
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((att, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md text-xs">
                          <Paperclip className="w-3 h-3 text-gray-500" />
                          <a 
                              href={`${buildFullUrl(att.fileUrl)}?token=${localStorage.getItem('accessToken') || ''}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="max-w-[150px] truncate text-blue-600 hover:underline"
                          >
                              {att.fileName}
                          </a>
                          <button 
                              onClick={() => removeReplyAttachment(index)}
                              className="text-gray-500 hover:text-red-500 ml-1"
                          >
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
            )}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                   {/* Mention Popover */}
                   <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 h-8 px-2" title="Mention someone">
                        <AtSign className="w-4 h-4 mr-1" />
                        Mention
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]" align="start">
                      <Command>
                        <CommandInput placeholder="Search member..." />
                        <CommandList>
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            {members?.map((member: any) => (
                              <CommandItem
                                key={member._id}
                                value={getUserName(member)}
                                onSelect={() => insertMention(getUserName(member))}
                              >
                                <Avatar className="w-6 h-6 mr-2">
                                    <AvatarImage src={member.profilePicture} />
                                    <AvatarFallback className="text-[10px]">{getAvatarFallbackText(getUserName(member))}</AvatarFallback>
                                </Avatar>
                                <span>{getUserName(member)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Reply Attachment Button */}
                  <input
                      type="file"
                      ref={replyFileInputRef}
                      className="hidden"
                      onChange={handleReplyFileSelect}
                  />
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 h-8 px-2" 
                      title="Attach file (Max 2MB)"
                      onClick={() => replyFileInputRef.current?.click()}
                      disabled={isReplyUploading}
                  >
                      <Paperclip className="w-4 h-4 mr-1" />
                      {isReplyUploading ? '...' : 'Attach'}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmitReply} disabled={isCreating || isReplyUploading || (!replyContent.trim() && replyAttachments.length === 0)}>
                    {isCreating ? 'Sending...' : 'Reply'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
            </div>
          </div>
        )}

        {/* Nested Comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
            {comment.children.map((child: any) => (
              <CommentItem
                key={child._id}
                comment={child}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                onEdit={onEdit}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                submitReply={submitReply}
                isCreating={isCreating}
                getUserName={getUserName}
                workItemId={workItemId}
                members={members}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export function CommentSection({ workItemId, workspaceId }: CommentSectionProps) {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const { data: comments, isLoading } = useGetComments(workItemId);
  const { mutate: createComment, isPending: isCreating } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { data: membersData } = useGetWorkspaceMembers(workspaceId);
  const queryClient = useQueryClient();

  useCommentsSubscription({ workspaceId, workItemId, enabled: true });

  // Normalize members list
  const members = useMemo(() => {
    const rawMembers = Array.isArray(membersData) ? membersData : (membersData?.members || []);
    return rawMembers
      .map((m: any) => m.user || m.userId)
      .filter((u: any) => u && (u._id || typeof u === 'string')); // Ensure user object exists
  }, [membersData]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileType?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentUserId = user?.id || user?._id;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        setErrorMsg('File size must be less than 2MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setIsUploading(true);
      try {
        const result = await commentApiService.uploadAttachment(workItemId, file);
        if (result.success || result.url) {
             setAttachments(prev => [...prev, { fileName: result.fileName, fileUrl: result.url, fileType: file.type }]);
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!newComment.trim() && attachments.length === 0) return;

    if (editingCommentId) {
      updateComment(
        { id: editingCommentId, data: { content: newComment } },
        {
          onSuccess: () => {
            setEditingCommentId(null);
            setNewComment('');
            setAttachments([]);
            queryClient.invalidateQueries({ queryKey: ['comments', workItemId] });
          },
        }
      );
    } else {
      createComment(
        { workItemId, content: newComment, userId: currentUserId, attachments },
        {
          onSuccess: () => {
            setNewComment('');
            setAttachments([]);
            queryClient.invalidateQueries({ queryKey: ['comments', workItemId] });
          },
        }
      );
    }
  };

  const handleReplySubmit = (parentId: string, content: string, attachments: any[] = []) => {
    createComment(
      { workItemId, content, userId: currentUserId, parentCommentId: parentId, attachments },
      {
        onSuccess: () => {
          setReplyingTo(null);
          queryClient.invalidateQueries({ queryKey: ['comments', workItemId] });
        },
      }
    );
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
    if (typeof u === 'string') return 'Unknown User';
    if (u.name) return u.name;
    if (u.username) return u.username;
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return 'Unknown User';
  };

  const insertMention = (memberName: string) => {
    setNewComment(prev => prev + `@${memberName} `);
    setMentionOpen(false);
  };

  // Build Comment Tree
  const commentTree = useMemo(() => {
    if (!comments) return [];
    
    const map = new Map();
    const roots: any[] = [];

    // Initialize map
    comments.forEach((c: any) => {
      map.set(c._id, { ...c, children: [] });
    });

    // Build tree
    comments.forEach((c: any) => {
      if (c.parentComment) {
        const parentId = typeof c.parentComment === 'object' ? c.parentComment._id : c.parentComment;
        const parent = map.get(parentId);
        if (parent) {
          parent.children.push(map.get(c._id));
        } else {
          roots.push(map.get(c._id));
        }
      } else {
        roots.push(map.get(c._id));
      }
    });

    // Sort function
    const sortNodes = (nodes: any[]) => {
      // Sort by createdAt (Oldest first for conversation flow, or Newest first)
      // Usually comments are Newest at top, but replies are Oldest at top (like Reddit/FB)
      // Let's keep it simple: Newest first for roots, Oldest first for replies?
      // Actually, standard is Newest first for everything or Oldest first for everything.
      // Let's do Newest first for roots, and Oldest first for children (conversation style).
      nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      nodes.forEach(n => {
        if (n.children.length > 0) sortNodes(n.children);
      });
    };

    // Sort roots Newest first
    roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Sort children Oldest first
    roots.forEach(r => {
        if (r.children.length > 0) sortNodes(r.children);
    });

    return roots;
  }, [comments]);

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
          <AvatarImage src={getProfileImageUrl(user?.profilePicture)} />
          <AvatarFallback className={getAvatarColor(getUserName(user))}>{getAvatarFallbackText(getUserName(user))}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={editingCommentId ? "Edit your comment..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-y bg-white dark:bg-muted/30"
          />
          {/* Attachment Preview */}
          {errorMsg && (
              <div className="text-xs text-red-500 mt-2">{errorMsg}</div>
          )}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md text-sm">
                        <Paperclip className="w-3 h-3 text-gray-500" />
                        <a 
                            href={`${buildFullUrl(att.fileUrl)}?token=${localStorage.getItem('accessToken') || ''}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="max-w-[150px] truncate text-blue-600 hover:underline"
                        >
                            {att.fileName}
                        </a>
                        <button 
                            onClick={() => removeAttachment(index)}
                            className="text-gray-500 hover:text-red-500 ml-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
               {/* Mention Popover */}
               <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" title="Mention someone">
                    <AtSign className="w-4 h-4 mr-1" />
                    Mention
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]" align="start">
                  <Command>
                    <CommandInput placeholder="Search member..." />
                    <CommandList>
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup>
                        {members?.map((member: any) => (
                          <CommandItem
                            key={member._id}
                            value={getUserName(member)}
                            onSelect={() => insertMention(getUserName(member))}
                          >
                            <Avatar className="w-6 h-6 mr-2">
                                <AvatarImage src={getProfileImageUrl(member.profilePicture)} />
                                <AvatarFallback className="text-[10px]">{getAvatarFallbackText(getUserName(member))}</AvatarFallback>
                            </Avatar>
                            <span>{getUserName(member)}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" 
                title="Attach file (Max 2MB)"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="w-4 h-4 mr-1" />
                {isUploading ? 'Uploading...' : 'Attach'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating || (!newComment.trim() && attachments.length === 0)}
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
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {commentTree.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={(id) => setReplyingTo(id === replyingTo ? null : id)}
            onDelete={handleDelete}
            onEdit={startEdit}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            submitReply={handleReplySubmit}
            isCreating={isCreating}
            getUserName={getUserName}
            workItemId={workItemId}
            members={members}
          />
        ))}
        {commentTree.length === 0 && (
            <div className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
            </div>
        )}
      </div>
    </div>
  );
}
