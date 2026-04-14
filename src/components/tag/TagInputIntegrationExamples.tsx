/**
 * TAGS INTEGRATION EXAMPLE FOR WORK-ITEM CREATION FORM
 * This file demonstrates how to integrate the TagInput component into an existing work-item creation form
 */

import React, { useState } from 'react';
import { TagInput } from '@/components/tag/TagInput';
import { useToast } from '@/hooks/use-toast';

/**
 * Example 1: Integrate TagInput in IssueCreateDialog
 * Add this section to your IssueCreateDialog component's form
 */
export function TagInputIntegrationExample1() {
  const [tags, setTags] = useState<string[]>([]);
  const { toast } = useToast();

  const handleCreateWorkItem = async (formData: any) => {
    try {
      // Your API call with tags included
      const response = await fetch('/pm-kanban/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags, // Array of tag IDs
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Work item created with tags',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create work item',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <TagInput
          workspaceId="YOUR_WORKSPACE_ID"
          selectedTags={tags}
          onTagsChange={setTags}
          placeholder="Select or create tags..."
        />
        <p className="text-sm text-gray-500 mt-1">
          Add tags to organize and filter work items across the workspace
        </p>
      </div>
    </div>
  );
}

/**
 * Example 2: Complete work-item creation form with tags
 */
interface CreateWorkItemFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export function CreateWorkItemFormWithTags({
  workspaceId,
  onSuccess,
}: CreateWorkItemFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Task',
    priority: 'medium',
    tags: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/pm-kanban/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          workspaceId,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'Task',
          priority: 'medium',
          tags: [],
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating work item:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Enter work item title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter work item description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Task">Task</option>
          <option value="Story">Story</option>
          <option value="Bug">Bug</option>
          <option value="Epic">Epic</option>
          <option value="Subtask">Subtask</option>
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Tags - Key Integration Point */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <TagInput
          workspaceId={workspaceId}
          selectedTags={formData.tags}
          onTagsChange={(tags) =>
            setFormData({ ...formData, tags })
          }
          placeholder="Add tags to organize work items..."
        />
        <p className="text-sm text-gray-500 mt-1">
          You can create new tags on the fly or select existing ones
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
      >
        Create Work Item
      </button>
    </form>
  );
}

/**
 * Example 3: Minimal integration in existing form
 * Just add this snippet to your existing form JSX
 */
export const MinimalTagInputIntegration = `
// In your form component, add:

import { TagInput } from '@/components/tag/TagInput';

// In your component state:
const [tags, setTags] = useState<string[]>([]);

// In your form JSX:
<div>
  <label>Tags</label>
  <TagInput
    workspaceId={workspaceId}
    selectedTags={tags}
    onTagsChange={setTags}
    placeholder="Add tags..."
  />
</div>

// In your submit handler:
const handleSubmit = async () => {
  const response = await createWorkItem({
    // ... other fields
    tags, // Include tags here
  });
};
`;

/**
 * Example 4: Advanced - With error handling and loading states
 */
export function AdvancedCreateWorkItemWithTags({
  workspaceId,
  onSuccess,
}: CreateWorkItemFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Task',
    tags: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      // Log tag data for debugging
      console.log('Creating work item with tags:', formData.tags);

      const response = await fetch('/pm-kanban/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...formData,
          workspaceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create work item');
      }

      const createdItem = await response.json();

      // Show success message
      toast({
        title: 'Success',
        description: `Work item "${createdItem.title}" created with ${formData.tags.length} tags`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'Task',
        tags: [],
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <input
        type="text"
        required
        value={formData.title}
        onChange={(e) =>
          setFormData({ ...formData, title: e.target.value })
        }
        placeholder="Work item title"
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />

      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description"
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        rows={4}
      />

      {/* Tags with loading state */}
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <TagInput
          workspaceId={workspaceId}
          selectedTags={formData.tags}
          onTagsChange={(tags) =>
            setFormData({ ...formData, tags })
          }
          placeholder="Add tags..."
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Work Item'}
      </button>
    </form>
  );
}
