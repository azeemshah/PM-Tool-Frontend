import { useRouteError } from 'react-router-dom';

export function ScrumboardErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <a
          href="/workspace"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go back
        </a>
      </div>
    </div>
  );
}
