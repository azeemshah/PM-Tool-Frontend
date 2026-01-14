import { Suspense } from "react";

const ScrumBoardView = () => {
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading Scrum Board...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Suspense fallback={<LoadingFallback />}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Scrum Board</h2>
          <p className="text-gray-600">Scrum board feature coming soon...</p>
        </div>
      </Suspense>
    </div>
  );
};

export default ScrumBoardView;

