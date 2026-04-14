import { useMutation, useQuery } from '@tanstack/react-query';
import { attachmentApiService } from '../services';

export const useUploadWorkItemAttachment = () => {
  return useMutation({
    mutationFn: ({ workItemId, file }: { workItemId: string; file: File }) =>
      attachmentApiService.uploadWorkItemAttachment({ workItemId, file }),
  });
};

export const useDeleteTaskAttachment = () => {
  return useMutation({
    mutationFn: ({ taskId, url }: { taskId: string; url: string }) =>
      attachmentApiService.deleteTaskAttachment({ taskId, url }),
  });
};

export const useDeleteBugAttachment = () => {
  return useMutation({
    mutationFn: ({ bugId, url }: { bugId: string; url: string }) =>
      attachmentApiService.deleteBugAttachment({ bugId, url }),
  });
};

export const useGetAllAttachments = (enabled = true) => {
  return useQuery({
    queryKey: ['allAttachments'],
    queryFn: () => attachmentApiService.getAllAttachments(),
    enabled,
  });
};

export const useGetWorkItemAttachments = (workItemId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workItemAttachments', workItemId],
    queryFn: () => attachmentApiService.getWorkItemAttachments(workItemId),
    enabled: enabled && !!workItemId,
  });
};

export const useDeleteAttachmentById = () => {
  return useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentApiService.deleteAttachmentById(attachmentId),
  });
};

export const useDeleteAttachmentByUrl = () => {
  return useMutation({
    mutationFn: (url: string) =>
      attachmentApiService.deleteAttachmentByUrl(url),
  });
};
