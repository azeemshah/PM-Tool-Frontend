/**
 * Member Details Component
 * Displays individual member information
 */

import React, { useEffect, useState } from 'react';
import type { Member } from '@/api/member/types';

interface MemberDetailsProps {
  member: Member;
  onEditRole?: (roleId: string) => void;
  onRemove?: () => void;
  isEditable?: boolean;
  roles?: Array<{ _id: string; name: string }>;
}

export const MemberDetails: React.FC<MemberDetailsProps> = ({
  member,
  onEditRole,
  onRemove,
  isEditable = false,
  roles = [],
}) => {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const m = member as any;
  const initialSelectedRole = m.roleId?._id || (typeof m.role === 'string' ? m.role : undefined);
  const [selectedRole, setSelectedRole] = useState(initialSelectedRole);

  const handleRoleChange = () => {
    if (onEditRole && selectedRole !== m.roleId._id) {
      onEditRole(selectedRole);
      setIsEditingRole(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {member.userId?.profilePicture && (
              <img
                src={member.userId.profilePicture}
                alt={member.userName || member.userId.name || ''}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {member.userName || `${member.userId?.firstName || ''} ${member.userId?.lastName || ''}`.trim() || member.userId?.name || 'Unknown'}
              </h3>
              <p className="text-gray-600">{member.userId?.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Role</p>
              {isEditingRole && isEditable ? (
                <div className="flex gap-2 mt-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                  >
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRoleChange}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingRole(false);
                      setSelectedRole(member.roleId._id);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {(() => {
                    const roleName = typeof member.role === 'string' ? member.role : member.roleId?.name;
                    return roleName || 'Member';
                  })()}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Joined Date</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {member.roleId?.permissions && member.roleId.permissions.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {member.roleId.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isEditable && (
          <div className="flex flex-col gap-2">
            {!isEditingRole && (
              <button
                onClick={() => setIsEditingRole(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Edit Role
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetails;
