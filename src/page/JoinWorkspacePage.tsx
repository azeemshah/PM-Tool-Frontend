/**
 * Join Workspace Page
 * Page for users to join a workspace using invite code
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinWorkspace } from '@/components/member';

export const JoinWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinSuccess = (workspaceId: string, role: string) => {
    setIsJoined(true);
    setTimeout(() => {
      navigate(`/workspace/${workspaceId}`);
    }, 2000);
  };

  const handleJoinError = (error: string) => {
    console.error('Join error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Join Workspace</h1>
            <p className="text-gray-600 mt-2">Enter the invite code to join a workspace</p>
          </div>

          {isJoined ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Workspace joined successfully!</p>
              <p className="text-sm mt-1">Redirecting...</p>
            </div>
          ) : (
            <JoinWorkspace
              onJoinSuccess={handleJoinSuccess}
              onJoinError={handleJoinError}
            />
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWorkspacePage;





