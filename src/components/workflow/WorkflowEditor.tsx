import { useState } from 'react';
import useGetWorkflow from '@/hooks/api/use-get-workflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApiService } from '@/api/workflow/services';

const WorkflowEditor: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const { data, isLoading } = useGetWorkflow(workflowId);
  const queryClient = useQueryClient();

  const [newStateName, setNewStateName] = useState('');
  const [newTransitionName, setNewTransitionName] = useState('');
  const [fromState, setFromState] = useState('');
  const [toState, setToState] = useState('');

  const createStateMutation = useMutation({
    mutationFn: ({ workflowId, data }: any) => workflowApiService.createState({ workflowId, data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] }),
  });

  const deleteStateMutation = useMutation({
    mutationFn: ({ workflowId, stateId }: any) => workflowApiService.deleteState({ workflowId, stateId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] }),
  });

  const createTransitionMutation = useMutation({
    mutationFn: ({ workflowId, data }: any) => workflowApiService.createTransition({ workflowId, data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] }),
  });

  const deleteTransitionMutation = useMutation({
    mutationFn: ({ workflowId, transitionId }: any) => workflowApiService.deleteTransition({ workflowId, transitionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] }),
  });

  if (isLoading) return <div>Loading workflow...</div>;
  if (!data) return <div>No workflow found</div>;

  const workflow = data;

  const handleAddState = () => {
    if (!newStateName) return;
    createStateMutation.mutate({ workflowId, data: { name: newStateName } });
    setNewStateName('');
  };

  const handleDeleteState = (stateId: string) => {
    deleteStateMutation.mutate({ workflowId, stateId });
  };

  const handleAddTransition = () => {
    if (!newTransitionName || !fromState || !toState) return;
    createTransitionMutation.mutate({ workflowId, data: { name: newTransitionName, fromState, toState } });
    setNewTransitionName('');
  };

  const handleDeleteTransition = (transitionId: string) => {
    deleteTransitionMutation.mutate({ workflowId, transitionId });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{workflow.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">States</h4>
          <ul className="space-y-2">
            {(workflow.states || []).map((s: any) => (
              <li key={s._id} className="flex items-center justify-between p-2 border rounded">
                <span>{s.name}</span>
                <div>
                  <button className="text-sm text-red-600" onClick={() => handleDeleteState(s._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <input value={newStateName} onChange={e => setNewStateName(e.target.value)} placeholder="New state name" className="input input-sm flex-1" />
            <button className="btn btn-sm" onClick={handleAddState}>Add</button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Transitions</h4>
          <ul className="space-y-2">
            {(workflow.transitions || []).map((t: any) => (
              <li key={t._id} className="flex items-center justify-between p-2 border rounded">
                <span>{t.name} — {t.fromState?.name} → {t.toState?.name}</span>
                <div>
                  <button className="text-sm text-red-600" onClick={() => handleDeleteTransition(t._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={fromState} onChange={e => setFromState(e.target.value)} className="input input-sm">
              <option value="">From state</option>
              {(workflow.states || []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select value={toState} onChange={e => setToState(e.target.value)} className="input input-sm">
              <option value="">To state</option>
              {(workflow.states || []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input value={newTransitionName} onChange={e => setNewTransitionName(e.target.value)} placeholder="Transition name" className="input input-sm col-span-2" />
            <button className="btn btn-sm col-span-2" onClick={handleAddTransition}>Add Transition</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;





