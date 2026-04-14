export interface Comment {
  _id: string;
  workItem: string;
  parentComment?: string;
  content: string;
  attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  workItemId: string;
  content: string;
  parentCommentId?: string;
  userId?: string;
  attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
}

export interface UpdateCommentDto {
  content: string;
  attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
}
