/**
 * Member Management Page
 * Complete page for managing workspace members
 */

import React, { useState, useEffect } from 'react';
import { useMember } from '@/hooks/useMember';
import {
  MemberList,
  AddMember,
  MemberStatistics,
  MemberDetails,
} from '@/components/member';
import type { Member } from '@/api/member/types';
import { showAlertDialog } from '@/lib/modal-alert';

interface MemberPageProps {
  workspaceId: string;
  users?: Array<{ _id: string; name: string; email: string }>;
  roles?: Array<{ _id: string; name: string }>;
  isAdmin?: boolean;
}

export const MemberManagementPage: React.FC<MemberPageProps> = ({
  workspaceId,
  users = [],
  roles = [],
  isAdmin = false,
}) => {
  const { members, loading, error, fetchWorkspaceMembers, updateMember, removeMember } = useMember();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers(workspaceId);
    }
  }, [workspaceId, refreshTrigger, fetchWorkspaceMembers]);

  // Try to derive invite code from members' workspace data if available
  useEffect(() => {
    if (members && members.length > 0 && !inviteCode) {
      const first = (members[0] as any).workspaceId;
      if (first && typeof first === 'object' && first.inviteCode) setInviteCode(first.inviteCode);
    }
  }, [members, inviteCode]);

  const handleMemberAdded = (success: boolean) => {
    if (success) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
  };

  const handleEditRole = async (roleId: string) => {
    if (selectedMember) {
      const updated = await updateMember(selectedMember._id, { roleId });
      if (updated) {
        setSelectedMember(updated);
        setRefreshTrigger((prev) => prev + 1);
      }
    }
  };

  const handleRemoveMember = async () => {
    if (selectedMember) {
      const success = await removeMember(selectedMember._id);
      if (success) {
        setSelectedMember(null);
        setRefreshTrigger((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-2">Manage workspace members and their roles</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Statistics and Add Member */}
          <div className="lg:col-span-1 space-y-8">
            <MemberStatistics workspaceId={workspaceId} />

            {isAdmin && (
              <AddMember
                workspaceId={workspaceId}
                users={users}
                roles={roles}
                onMemberAdded={handleMemberAdded}
              />
            )}
          </div>

          {/* Right Column - Member List and Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Workspace Members ({members.length})
                </h2>
              </div>

              {/* Invite link area */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Invite members to join you</h3>
                <p className="text-sm text-gray-600 mb-4">Anyone with an invite link can join this Workspace. You can also disable and create a new invite link for this Workspace at any time.</p>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={inviteCode ? `${window.location.origin}/invite/workspace/${inviteCode}/join` : ''}
                    placeholder="Invite link will appear here"
                    className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const link = inviteCode ? `${window.location.origin}/invite/workspace/${inviteCode}/join` : '';
                      if (link) {
                        navigator.clipboard?.writeText(link).then(() => {
                          void showAlertDialog({
                            title: 'Copied',
                            description: 'Invite link copied to clipboard',
                            confirmText: 'OK',
                          });
                        });
                      }
                    }}
                    className="bg-black text-white p-3 rounded-r-md"
                    aria-label="Copy invite link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading members...</div>
                ) : (
                  <MemberList
                    workspaceId={workspaceId}
                    onMemberSelect={handleMemberSelect}
                    onRemoveMember={() => setRefreshTrigger((prev) => prev + 1)}
                  />
                )}
              </div>
            </div>

            {selectedMember && (
              <MemberDetails
                member={selectedMember}
                isEditable={isAdmin}
                roles={roles}
                onEditRole={handleEditRole}
                onRemove={handleRemoveMember}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManagementPage;





