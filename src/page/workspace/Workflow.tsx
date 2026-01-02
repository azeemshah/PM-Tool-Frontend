import { useState } from 'react';
import useGetWorkflows from '@/hooks/api/use-get-workflows';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkflowMutationFn, deleteWorkflowMutationFn } from '@/lib/api';
import WorkflowEditor from '@/components/workflow/WorkflowEditor';

const WorkflowPage = () => {
  const { data, isLoading } = useGetWorkflows();
  const workflows = data || [];
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => createWorkflowMutationFn(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflowMutationFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setSelected(null);
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <input className="input" placeholder="Workflow name" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn" onClick={() => { if (!name) return; createMutation.mutate({ name }); setName(''); }}>Create Workflow</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium mb-2">Workflows</h4>
          <ul className="space-y-2">
            {workflows.map((w: any) => (
              <li key={w._id} className={`p-2 border rounded cursor-pointer ${selected === w._id ? 'bg-gray-100' : ''}`} onClick={() => setSelected(w._id)}>
                <div className="flex justify-between items-center">
                  <div>{w.name}</div>
                  <button className="text-sm text-red-600" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(w._id); }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2">
          {selected ? <WorkflowEditor workflowId={selected} /> : <div>Select a workflow to edit</div>}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
