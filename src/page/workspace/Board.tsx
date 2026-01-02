import { Suspense } from "react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BoardsView } from '@/components/scrumboard/views/BoardsView';
import { ScrumboardBoardView } from '@/components/scrumboard/ScrumboardBoardView';
import { ScrumboardAppContextProvider } from '@/contexts/ScrumboardAppContext';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId?: string }>();

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading Scrumboard...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <ScrumboardAppContextProvider>
          <Suspense fallback={<LoadingFallback />}>
            {boardId ? <ScrumboardBoardView /> : <BoardsView />}
          </Suspense>
        </ScrumboardAppContextProvider>
      </ErrorBoundary>
    </div>
  );
};

export default BoardPage;
