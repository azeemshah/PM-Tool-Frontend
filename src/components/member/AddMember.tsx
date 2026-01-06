/**
 * Add Member Component
 * Form to add new member to workspace
 */

import React, { useState, useEffect } from 'react';
import { useMember } from '@/hooks/useMember';
import type { CreateMemberDTO } from '@/api/member/types';

interface AddMemberProps {
  workspaceId: string;
  onMemberAdded?: (success: boolean) => void;
  users?: Array<{ _id: string; name: string; email: string }>;
  roles?: Array<{ _id: string; name: string }>;
}

export const AddMember: React.FC<AddMemberProps> = ({
  workspaceId,
  onMemberAdded,
  users = [],
  roles = [],
}) => {
  const { addMember, loading, error } = useMember();
  const [formData, setFormData] = useState<CreateMemberDTO>({
    userId: '',
    workspaceId,
    roleId: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      workspaceId,
    }));
  }, [workspaceId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!formData.userId || !formData.roleId) {
      alert('Please select both user and role');
      return;
    }

    const result = await addMember(formData);
    if (result) {
      setSuccessMessage('Member added successfully!');
      setFormData({
        userId: '',
        workspaceId,
        roleId: '',
      });
      if (onMemberAdded) {
        onMemberAdded(true);
      }
    } else if (onMemberAdded) {
      onMemberAdded(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Add Member</h3>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {successMessage}
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
            User
          </label>
          <select
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Adding...' : 'Add Member'}
        </button>
      </form>
    </div>
  );
};

export default AddMember;
