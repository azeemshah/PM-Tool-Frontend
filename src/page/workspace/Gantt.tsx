import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GanttChart } from '@/components/gantt-chart';
import useWorkspaceId from '@/hooks/use-workspace-id';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <div className="inline-block animate-spin">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full"></div>
      </div>
      <p className="mt-4 text-muted-foreground text-sm font-medium">Loading Gantt Chart...</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <h2 className="text-lg font-semibold text-destructive">Error Loading Gantt Chart</h2>
      <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
    </div>
  </div>
);

const GanttPage = () => {
  const workspaceId = useWorkspaceId();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">No workspace selected</p>
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
      <div className="flex-1 border rounded-xl shadow-sm overflow-hidden bg-background border-border min-h-0">
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
