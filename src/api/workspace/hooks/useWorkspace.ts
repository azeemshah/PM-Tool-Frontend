import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceApiService } from '../services';
import {
  CreateWorkspaceType,
  EditWorkspaceType,
  ChangeWorkspaceMemberRoleType,
} from '@/types/api.type';

export const useCreateWorkspace = () => {
  return useMutation({
    mutationFn: (data: CreateWorkspaceType) =>
      workspaceApiService.createWorkspace(data),
  });
};

export const useEditWorkspace = () => {
  return useMutation({
    mutationFn: (params: EditWorkspaceType) =>
      workspaceApiService.editWorkspace(params),
  });
};

export const useGetAllWorkspacesUserIsMember = (enabled = true) => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceApiService.getAllWorkspacesUserIsMember(),
    enabled,
  });
};

export const useGetWorkspaceById = (workspaceId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApiService.getWorkspaceById(workspaceId),
    enabled: enabled && !!workspaceId,
  });
};

export const useGetWorkspaceMembers = (workspaceId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => workspaceApiService.getMembers(workspaceId),
    enabled: enabled && !!workspaceId,
  });
};

export const useChangeWorkspaceMemberRole = () => {
  return useMutation({
    mutationFn: (params: ChangeWorkspaceMemberRoleType) =>
      workspaceApiService.changeMemberRole(params),
  });
};

export const useDeleteWorkspace = () => {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceApiService.deleteWorkspace(workspaceId),
  });
};

export const useInviteUserJoinWorkspace = () => {
  return useMutation({
    mutationFn: (inviteCode: string) =>
      workspaceApiService.inviteUserJoinWorkspace(inviteCode),
  });
};
