/**
 * Member List Component
 * Displays all members in a workspace
 */

import React, { useEffect } from 'react';
import { useMember } from '@/hooks/useMember';
import type { Member } from '@/api/member/types';

interface MemberListProps {
  workspaceId: string;
  onMemberSelect?: (member: Member) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  workspaceId,
  onMemberSelect,
  onRemoveMember,
}) => {
  const { members, loading, error, fetchWorkspaceMembers, removeMember } = useMember();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceMembers]);

  const handleRemove = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      const success = await removeMember(memberId);
      if (success && onRemoveMember) onRemoveMember(memberId);
    }
  };

  const initials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) return <div className="p-4 text-center">Loading members...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!members || members.length === 0) return <div className="p-4 text-center text-gray-500">No members found</div>;

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member._id}
          className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
              {member.userId?.profilePicture ? (
                <img src={member.userId.profilePicture} alt={member.userId.name || ''} className="w-10 h-10 rounded-full" />
              ) : (
                <span>{initials(member.userId?.name)}</span>
              )}
            </div>

            <div>
              <div className="font-medium text-gray-900">{member.userId?.name || 'Unknown'}</div>
              <div className="text-sm text-gray-600">{member.userId?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="px-4 py-1 border rounded-full text-sm text-gray-700 bg-white">{member.roleId?.name || 'Member'}</div>
            <button
              onClick={() => handleRemove(member._id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberList;





