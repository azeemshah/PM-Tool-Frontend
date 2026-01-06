/**
 * Member Statistics Component
 * Displays member count and distribution by role
 */

import React, { useEffect, useState } from 'react';
import { memberApiService } from '@/api/member/services/memberApiService';
import type { MemberStats } from '@/api/member/types';

interface MemberStatsProps {
  workspaceId: string;
}

export const MemberStatistics: React.FC<MemberStatsProps> = ({ workspaceId }) => {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await memberApiService.getMemberStats(workspaceId);
        setStats(data);
        setError('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch statistics';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchStats();
    }
  }, [workspaceId]);

  if (loading) {
    return <div className="p-4 text-center">Loading statistics...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="p-4 text-center text-gray-500">No statistics available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Member Statistics</h3>

      <div className="mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Total Members</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalMembers}</p>
        </div>
      </div>

      {stats.membersByRole && stats.membersByRole.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Members by Role</h4>
          <div className="space-y-3">
            {stats.membersByRole.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700">
                  {item.role?.name || 'Unknown Role'}
                </span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberStatistics;
