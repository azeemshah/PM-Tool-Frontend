/**
 * Join Workspace by Invite Component
 * Allows users to join a workspace using an invite code
 */

import React, { useState } from 'react';
import { memberApiService } from '@/api/member/services/memberApiService';

interface JoinWorkspaceProps {
  onJoinSuccess?: (workspaceId: string, role: string) => void;
  onJoinError?: (error: string) => void;
}

export const JoinWorkspace: React.FC<JoinWorkspaceProps> = ({
  onJoinSuccess,
  onJoinError,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const result = await memberApiService.joinWorkspaceByInvite(inviteCode);
      setSuccess(`Successfully joined workspace with role: ${result.role}`);
      setInviteCode('');
      
      if (onJoinSuccess) {
        onJoinSuccess(result.workspaceId, result.role);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join workspace';
      setError(message);
      if (onJoinError) {
        onJoinError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Join Workspace</h3>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Joining...' : 'Join Workspace'}
        </button>
      </form>
    </div>
  );
};

export default JoinWorkspace;
