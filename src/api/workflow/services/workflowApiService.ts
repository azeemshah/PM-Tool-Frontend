import API from "@/lib/axios-client";

export const workflowApiService = {
  getWorkflows: async () => {
    const response = await API.get("/workflows");
    return response.data;
  },

  getWorkflowById: async (workflowId: string) => {
    const response = await API.get(`/workflows/${workflowId}`);
    return response.data;
  },

  createWorkflow: async (data: Record<string, unknown>) => {
    const response = await API.post("/workflows", data);
    return response.data;
  },

  updateWorkflow: async ({
    workflowId,
    data,
  }: {
    workflowId: string;
    data: Record<string, unknown>;
  }) => {
    const response = await API.put(`/workflows/${workflowId}`, data);
    return response.data;
  },

  deleteWorkflow: async (workflowId: string) => {
    const response = await API.delete(`/workflows/${workflowId}`);
    return response.data;
  },

  getStates: async (workflowId: string) => {
    const response = await API.get(`/workflows/${workflowId}/states`);
    return response.data;
  },

  createState: async ({
    workflowId,
    data,
  }: {
    workflowId: string;
    data: Record<string, unknown>;
  }) => {
    const response = await API.post(`/workflows/${workflowId}/states`, data);
    return response.data;
  },

  deleteState: async ({
    workflowId,
    stateId,
  }: {
    workflowId: string;
    stateId: string;
  }) => {
    const response = await API.delete(`/workflows/${workflowId}/states/${stateId}`);
    return response.data;
  },

  getTransitions: async (workflowId: string) => {
    const response = await API.get(`/workflows/${workflowId}/transitions`);
    return response.data;
  },

  createTransition: async ({
    workflowId,
    data,
  }: {
    workflowId: string;
    data: Record<string, unknown>;
  }) => {
    const response = await API.post(`/workflows/${workflowId}/transitions`, data);
    return response.data;
  },

  deleteTransition: async ({
    workflowId,
    transitionId,
  }: {
    workflowId: string;
    transitionId: string;
  }) => {
    const response = await API.delete(
      `/workflows/${workflowId}/transitions/${transitionId}`
    );
    return response.data;
  },
};
