import { useMutation, useQuery } from '@tanstack/react-query';
import { workflowApiService } from '../services';

export const useGetWorkflows = (enabled = true) => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowApiService.getWorkflows(),
    enabled,
  });
};

export const useGetWorkflowById = (workflowId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowApiService.getWorkflowById(workflowId),
    enabled: enabled && !!workflowId,
  });
};

export const useCreateWorkflow = () => {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      workflowApiService.createWorkflow(data),
  });
};

export const useUpdateWorkflow = () => {
  return useMutation({
    mutationFn: (params: { workflowId: string; data: Record<string, unknown> }) =>
      workflowApiService.updateWorkflow(params),
  });
};

export const useDeleteWorkflow = () => {
  return useMutation({
    mutationFn: (workflowId: string) =>
      workflowApiService.deleteWorkflow(workflowId),
  });
};

export const useGetWorkflowStates = (workflowId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workflowStates', workflowId],
    queryFn: () => workflowApiService.getStates(workflowId),
    enabled: enabled && !!workflowId,
  });
};

export const useCreateWorkflowState = () => {
  return useMutation({
    mutationFn: (params: {
      workflowId: string;
      data: Record<string, unknown>;
    }) => workflowApiService.createState(params),
  });
};

export const useDeleteWorkflowState = () => {
  return useMutation({
    mutationFn: (params: { workflowId: string; stateId: string }) =>
      workflowApiService.deleteState(params),
  });
};

export const useGetWorkflowTransitions = (workflowId: string, enabled = true) => {
  return useQuery({
    queryKey: ['workflowTransitions', workflowId],
    queryFn: () => workflowApiService.getTransitions(workflowId),
    enabled: enabled && !!workflowId,
  });
};

export const useCreateWorkflowTransition = () => {
  return useMutation({
    mutationFn: (params: {
      workflowId: string;
      data: Record<string, unknown>;
    }) => workflowApiService.createTransition(params),
  });
};

export const useDeleteWorkflowTransition = () => {
  return useMutation({
    mutationFn: (params: { workflowId: string; transitionId: string }) =>
      workflowApiService.deleteTransition(params),
  });
};
