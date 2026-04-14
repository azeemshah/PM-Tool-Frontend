import API from "@/lib/axios-client";

export const attachmentApiService = {
  uploadWorkItemAttachment: async ({
    workItemId,
    file,
  }: {
    workItemId: string;
    file: File;
  }) => {
    const form = new FormData();
    form.append("file", file);
    const response = await API.post(`/pm-kanban/files/upload/${workItemId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteTaskAttachment: async ({
    taskId,
    url,
  }: {
    taskId: string;
    url: string;
  }) => {
    const response = await API.delete(
      `/projects/tasks/${taskId}/attachments?url=${encodeURIComponent(url)}`
    );
    return response.data;
  },

  deleteBugAttachment: async ({
    bugId,
    url,
  }: {
    bugId: string;
    url: string;
  }) => {
    const response = await API.delete(
      `/projects/bugs/${bugId}/attachments?url=${encodeURIComponent(url)}`
    );
    return response.data;
  },

  getAllAttachments: async () => {
    const response = await API.get("/pm-kanban/files");
    return response.data?.data || response.data || [];
  },

  getWorkItemAttachments: async (workItemId: string) => {
    const response = await API.get(`/pm-kanban/files/work-item/${workItemId}`);
    const items = response.data?.data || response.data || [];
    return (items as Record<string, unknown>[]).map(
      (a: Record<string, unknown>) => ({
        _id: a._id,
        url: a.fileUrl,
        name: a.fileName,
      })
    );
  },

  deleteAttachmentById: async (attachmentId: string) => {
    const response = await API.delete(`/pm-kanban/files/${attachmentId}`);
    return response.data;
  },

  deleteAttachmentByUrl: async (url: string) => {
    const response = await API.delete(
      `/pm-kanban/files/by-url?url=${encodeURIComponent(url)}`
    );
    return response.data;
  },
};
