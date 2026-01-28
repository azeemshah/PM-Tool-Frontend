export interface Comment {
  _id: string;
  workItem: string;
  parentComment?: string;
  content: string;
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
}

export interface UpdateCommentDto {
  content: string;
}
