# Tags System - Frontend Components

## Overview

The Tags system provides a comprehensive solution for organizing and filtering work items across a workspace using reusable, keyword-based tags. This directory contains all frontend components and hooks for tag management.

## Components

### TagInput Component

A multi-select input component with auto-suggest functionality for assigning tags to work items.

**Location**: `src/components/tag/TagInput.tsx`

#### Features

- ✨ Auto-suggest with debounced search (300ms)
- 🏷️ Multi-select tag input with visual feedback
- ➕ Create new tags on-the-fly (press Enter)
- ❌ Remove individual tags with X button
- 🔍 Case-insensitive search
- 📦 Dropdown with filtered results
- ⚡ Real-time updates

#### Usage

```tsx
import { TagInput } from "@/components/tag/TagInput";

function WorkItemForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <TagInput
      workspaceId="workspace-id"
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      placeholder="Add tags..."
      disabled={false}
    />
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceId` | `string` | Yes | The workspace ID for tag context |
| `selectedTags` | `string[]` | Yes | Array of selected tag IDs |
| `onTagsChange` | `(tags: string[]) => void` | Yes | Callback when tags change |
| `placeholder` | `string` | No | Input placeholder text (default: "Add tags...") |
| `disabled` | `boolean` | No | Disable input (default: false) |
| `className` | `string` | No | Additional CSS classes |

#### Keyboard Shortcuts

- **Enter**: Create new tag with input text
- **Escape**: Close dropdown (via browser default)
- **Backspace**: Remove last selected tag (when input is empty)

---

### TagFilter Component

A filter component with checkbox interface for searching and filtering work items by tags.

**Location**: `src/components/tag/TagFilter.tsx`

#### Features

- 🎯 Multi-select checkbox filtering
- 🔢 Show selected count on button
- 🗑️ Clear all selections option
- 📊 Display selected tags as badges
- 🚀 Apply filter with callback
- 📥 Auto-load all workspace tags

#### Usage

```tsx
import { TagFilter } from "@/components/tag/TagFilter";

function WorkItemsList() {
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const handleApplyFilter = () => {
    // Fetch filtered work items
    fetchWorkItems({ tags: filterTags });
  };

  return (
    <>
      <TagFilter
        workspaceId="workspace-id"
        selectedTags={filterTags}
        onTagsChange={setFilterTags}
        onFilterApply={handleApplyFilter}
      />
      {/* Display filtered items */}
    </>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceId` | `string` | Yes | The workspace ID for tag context |
| `selectedTags` | `string[]` | Yes | Array of selected tag IDs |
| `onTagsChange` | `(tags: string[]) => void` | Yes | Callback when selections change |
| `onFilterApply` | `() => void` | No | Callback when filter applied |
| `className` | `string` | No | Additional CSS classes |

---

## Hooks

### useTags Hook

Custom React Query hook for tag API operations.

**Location**: `src/hooks/api/use-tags.tsx`

#### Functions

```tsx
const {
  getAllTagsByWorkspace,
  searchTags,
  getTagById,
  getTagsByIds,
  createTag,
  updateTag,
  deleteTag,
  checkTagExists,
} = useTags();
```

#### API Reference

##### Get All Tags by Workspace

```tsx
const { data: tags, isLoading } = getAllTagsByWorkspace(workspaceId);
```

Returns all tags for a workspace, sorted by name.

---

##### Search Tags (Auto-suggest)

```tsx
const { data: suggestions } = searchTags(workspaceId, "bug", 10);
```

Returns up to `limit` tags matching the search term.

---

##### Get Tag by ID

```tsx
const { data: tag } = getTagById(tagId);
```

Fetches a single tag by ID.

---

##### Get Tags by IDs

```tsx
const { data: tags } = getTagsByIds([tagId1, tagId2]);
```

Fetches multiple tags by their IDs.

---

##### Create Tag Mutation

```tsx
createTag.mutate(
  { name: "new-tag", workspaceId },
  {
    onSuccess: (newTag) => {
      console.log("Tag created:", newTag);
    },
    onError: (error) => {
      console.error("Failed to create tag:", error);
    },
  }
);
```

---

##### Update Tag Mutation

```tsx
updateTag.mutate(
  { 
    tagId: "tag-id", 
    payload: { name: "updated-name" }
  },
  {
    onSuccess: (updatedTag) => {
      console.log("Tag updated:", updatedTag);
    },
  }
);
```

---

##### Delete Tag Mutation

```tsx
deleteTag.mutate(tagId, {
  onSuccess: () => {
    console.log("Tag deleted successfully");
  },
});
```

---

##### Check Tag Existence

```tsx
const { data: result } = checkTagExists(workspaceId, "tag-name");
// result: { exists: boolean, tagName: string }
```

---

## Integration Examples

### Basic Integration in Work Item Form

```tsx
import { TagInput } from "@/components/tag/TagInput";
import { useState } from "react";

export function CreateWorkItemForm({ workspaceId }) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/kanban/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        tags,
        workspaceId,
      }),
    });

    if (response.ok) {
      setTitle("");
      setTags([]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Work item title"
      />

      <TagInput
        workspaceId={workspaceId}
        selectedTags={tags}
        onTagsChange={setTags}
      />

      <button type="submit">Create</button>
    </form>
  );
}
```

### Filtering Work Items by Tags

```tsx
import { TagFilter } from "@/components/tag/TagFilter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function WorkItemsList({ workspaceId }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: items } = useQuery({
    queryKey: ["work-items", workspaceId, selectedTags],
    queryFn: async () => {
      const params = new URLSearchParams();
      selectedTags.forEach((tag) => params.append("tags", tag));

      const response = await fetch(
        `/kanban/items?${params.toString()}`
      );
      return response.json();
    },
  });

  return (
    <div>
      <TagFilter
        workspaceId={workspaceId}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onFilterApply={() => {
          // Refetch items with new filters
        }}
      />

      <div>
        {items?.map((item) => (
          <div key={item._id}>{item.title}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Styling

Components use Tailwind CSS for styling. Ensure your project has Tailwind configured.

### Custom Styling

Both components accept optional `className` prop for additional styling:

```tsx
<TagInput
  workspaceId="ws-id"
  selectedTags={tags}
  onTagsChange={setTags}
  className="border-2 border-blue-500 rounded-xl"
/>
```

---

## Error Handling

### Common Errors

1. **"Tag 'name' already exists in this workspace"**
   - Cause: Attempting to create duplicate tag
   - Solution: Use the existing tag or rename it

2. **"Invalid workspace ID"**
   - Cause: Invalid MongoDB ObjectId format
   - Solution: Verify workspaceId is valid

3. **"Tag not found"**
   - Cause: Tag ID doesn't exist
   - Solution: Refresh tag list and try again

### Example Error Handling

```tsx
const { mutate: createTag } = useTags().createTag;

createTag(
  { name: "new-tag", workspaceId },
  {
    onError: (error) => {
      if (error.message.includes("already exists")) {
        // Show duplicate error
      } else if (error.message.includes("Invalid workspace")) {
        // Show validation error
      }
    },
  }
);
```

---

## Performance Tips

1. **Debounced Search**: TagInput automatically debounces search (300ms)
2. **Query Caching**: React Query caches tag queries (5 minute stale time)
3. **Batch Fetching**: Use `getTagsByIds()` for multiple tags instead of individual queries
4. **Lazy Loading**: Load tag filter only when needed

---

## Accessibility

- ♿ Full keyboard navigation support
- 📱 Touch-friendly on mobile
- 🎯 Proper ARIA labels on interactive elements
- 🔍 Semantic HTML structure

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

---

## Related Files

- Backend API: `src/kanban/tag/`
- Type Definitions: `@/types/tag.ts`
- Integration Examples: `TagInputIntegrationExamples.tsx`

---

## FAQ

**Q: Can I create tags without selecting them?**
A: Tags are auto-created during creation of work items. Use TagFilter for tag management.

**Q: How are tags isolated per workspace?**
A: All tags are stored with `workspaceId`. The backend enforces uniqueness per workspace.

**Q: Can tags be reused across work item types?**
A: Yes, tags are completely agnostic to work item types and can be applied to any type.

**Q: What happens when I delete a tag?**
A: The tag is removed from the database. Consider removing it from all work items first.

**Q: How many tags can I assign to one work item?**
A: No limit defined. Design your UX accordingly.

---

## Support & Troubleshooting

For issues:
1. Check browser console for API errors
2. Verify workspaceId is valid
3. Ensure JWT token is in localStorage
4. Check network tab for API responses
5. Review backend TAGS_IMPLEMENTATION_GUIDE.md

---
