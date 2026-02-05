import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GanttChart } from '@/components/gantt-chart';
import useWorkspaceId from '@/hooks/use-workspace-id';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <div className="inline-block animate-spin">
        <div className="w-8 h-8 border-4 border-gray-200 dark:border-zinc-700 border-t-blue-600 rounded-full"></div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">Loading Gantt Chart...</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Error Loading Gantt Chart</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{error.message}</p>
    </div>
  </div>
);

const GanttPage = () => {
  const workspaceId = useWorkspaceId();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-400 text-sm">No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gantt Chart</h2>
          <p className="text-muted-foreground">
            Visualize project timeline and dependencies
          </p>
        </div>
      </div>
      <div className="flex-1 border rounded-xl shadow-sm overflow-hidden bg-white dark:bg-zinc-950 dark:border-zinc-800 min-h-0">
        <ErrorBoundary fallback={ErrorFallback}>
          <Suspense fallback={<LoadingFallback />}>
            <GanttChart workspaceId={workspaceId} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default GanttPage;
