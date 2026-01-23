import { useParams, useSearchParams } from 'react-router-dom';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { useGetWorkspaceSprints } from '@/api/scrumboard/hooks/sprints/useGetWorkspaceSprints';
import { ScrumboardProvider } from '@/contexts/ScrumboardContext';
import SprintList from './components/SprintList';
import BacklogPanel from './components/BacklogPanel';
import SprintBoard from './components/SprintBoard';

const ScrumBoardView = () => {
  const workspaceId = useWorkspaceId();
  const { sprintId } = useParams<{ sprintId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: sprints, isLoading } = useGetWorkspaceSprints(workspaceId);

  const activeSprintId = searchParams.get('sprint') || sprintId || null;

  const handleSprintSelect = (id: string | null) => {
    if (id) {
      setSearchParams({ sprint: id });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('sprint');
      setSearchParams(newParams);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading Sprints...</p>
        </div>
      </div>
    );
  }

  const activeSprint = sprints?.find(s => s._id === activeSprintId);

  return (
    <ScrumboardProvider>
      <div className="flex h-full bg-gray-50 dark:bg-background">
        {/* Sprint List Sidebar */}
        <SprintList
          sprints={sprints || []}
          activeSprintId={activeSprintId}
          onSprintSelect={handleSprintSelect}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeSprint ? (
            <SprintBoard key={activeSprint._id} sprint={activeSprint} />
          ) : (
            <BacklogPanel workspaceId={workspaceId} />
          )}
        </div>
      </div>
    </ScrumboardProvider>
  );
};

export default ScrumBoardView;

