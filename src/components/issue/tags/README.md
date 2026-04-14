# Work Item Tags System

Complete frontend tagging system for organizing, filtering, and discovering work items by theme-based tags.

## 📁 Folder Structure

```
src/components/issue/tags/
├── TagBadge.tsx                    # Single tag badge display
├── TagDisplay.tsx                  # Multiple tags display
├── TagManager.tsx                  # Edit tags modal/dialog
├── TagFilterPanel.tsx              # Tag-based filter UI
├── TagStatistics.tsx               # Tag usage analytics
├── WorkItemTags.tsx                # Complete tag display component
├── TagsIntegrationExample.tsx      # Full integration example
├── index.ts                        # Exports all components
├── INTEGRATION_GUIDE.md            # Detailed integration guide
├── IMPLEMENTATION_SUMMARY.md       # Implementation overview
├── INTEGRATION_CHECKLIST.md        # Integration checklist
└── README.md                       # This file
```

## 🚀 Quick Start

### 1. Display Tags on Work Item
```tsx
import { WorkItemTags } from "@/components/issue/tags";

<WorkItemTags 
  tags={item.tags}
  editable={true}
  onEditTags={() => showEditor(true)}
/>
```

### 2. Filter Work Items by Tags
```tsx
import { TagFilterPanel } from "@/components/issue/tags";

<TagFilterPanel
  workspaceId={workspaceId}
  selectedTags={selectedTags}
  onTagsChange={setSelectedTags}
  onApply={applyFilter}
/>
```

### 3. Show Tag Statistics
```tsx
import { TagStatistics } from "@/components/issue/tags";

<TagStatistics
  workspaceId={workspaceId}
  workItems={allWorkItems}
  limit={10}
/>
```

### 4. Manage Work Item Tags
```tsx
import { TagManager } from "@/components/issue/tags";
import { useWorkItemTags } from "@/hooks/api/use-work-item-tags";

const { assignTags } = useWorkItemTags({
  workItemId: item._id,
  workspaceId
});

<TagManager
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  workspaceId={workspaceId}
  workItemId={item._id}
  currentTags={item.tags?.map(t => t._id) || []}
  onTagsUpdate={(tags) => assignTags(tags)}
/>
```

## 📚 Components

### TagBadge
Individual tag display with optional remove button.

**Props:**
- `name: string` - Tag name
- `tagId?: string` - Tag ID for callbacks
- `onRemove?: (id: string) => void` - Remove handler
- `removable?: boolean` - Show remove button
- `variant?: 'default' | 'outline' | 'soft'` - Style variant
- `color?: string` - Color mapping for category

**Example:**
```tsx
<TagBadge name="bug" removable tagId="123" onRemove={handleRemove} />
```

---

### TagDisplay
Display multiple tags with overflow handling.

**Props:**
- `tags: Array` - Tag objects or strings
- `removable?: boolean` - Enable remove buttons
- `onRemoveTag?: (id: string) => void` - Remove handler
- `variant?: 'default' | 'outline' | 'soft'` - Style
- `limit?: number` - Max visible tags
- `showMore?: boolean` - Show "+X more"
- `emptyMessage?: string` - Empty state message

**Example:**
```tsx
<TagDisplay 
  tags={item.tags} 
  limit={3} 
  showMore={true}
/>
```

---

### TagManager
Modal dialog for editing work item tags.

**Props:**
- `isOpen: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State handler
- `workspaceId: string` - Workspace ID
- `workItemId: string` - Work item ID
- `currentTags: string[]` - Current tag IDs
- `onTagsUpdate: (tags: string[]) => void` - Save handler
- `loading?: boolean` - Loading state
- `title?: string` - Dialog title

**Example:**
```tsx
<TagManager
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  workspaceId="ws-123"
  workItemId="item-456"
  currentTags={["tag1", "tag2"]}
  onTagsUpdate={handleSave}
/>
```

---

### TagFilterPanel
Filter panel for selecting tags to filter work items.

**Props:**
- `workspaceId: string` - Workspace ID
- `selectedTags: string[]` - Selected tag IDs
- `onTagsChange: (tags: string[]) => void` - Selection handler
- `onApply?: () => void` - Apply filter callback
- `compact?: boolean` - Collapsible mode
- `className?: string` - Custom classes

**Example:**
```tsx
<TagFilterPanel
  workspaceId="ws-123"
  selectedTags={selected}
  onTagsChange={setSelected}
  onApply={applyFilter}
  compact={true}
/>
```

---

### TagStatistics
Bar chart showing tag usage distribution.

**Props:**
- `workspaceId: string` - Workspace ID
- `workItems?: any[]` - Work items for counting
- `limit?: number` - Top N tags
- `compact?: boolean` - Compact display
- `className?: string` - Custom classes

**Example:**
```tsx
<TagStatistics
  workspaceId="ws-123"
  workItems={items}
  limit={10}
/>
```

---

### WorkItemTags
Complete display component for work item tags.

**Props:**
- `tags: any[]` - Tag objects
- `onEditTags?: () => void` - Edit callback
- `editable?: boolean` - Show edit button
- `variant?: 'default' | 'outline' | 'soft'` - Style
- `limit?: number` - Max visible tags
- `className?: string` - Custom classes

**Example:**
```tsx
<WorkItemTags 
  tags={item.tags}
  editable={true}
  onEditTags={handleEdit}
/>
```

## 🎣 Hooks

### useWorkItemTags
Manage tags on work items.

```tsx
import { useWorkItemTags } from "@/hooks/api/use-work-item-tags";

const {
  assignTags,      // (ids: string[]) => Promise
  addTag,          // (current: string[], newId: string) => Promise
  removeTag,       // (current: string[], removeId: string) => Promise
  isLoading,       // boolean
  isPending        // boolean
} = useWorkItemTags({
  workItemId: string,
  workspaceId: string
});
```

**Methods:**
- `assignTags(tagIds)` - Set all tags
- `addTag(currentTags, newId)` - Add single tag
- `removeTag(currentTags, removeId)` - Remove single tag

---

### useTags
Tag query and mutation operations.

```tsx
import { useTags } from "@/hooks/api/use-tags";

const {
  getAllTagsByWorkspace,    // (id: string) => Query
  searchTags,               // (id: string, term: string) => Query
  getTagById,              // (id: string) => Query
  getTagsByIds,            // (ids: string[]) => Query
  createTag,               // Mutation
  updateTag,               // Mutation
  deleteTag                // Mutation
} = useTags();
```

## 🎨 Styling

### Color Variants
Built-in color mappings for common categories:

- `bug` - Red
- `feature` - Green
- `tech-debt` - Yellow
- `release-work` - Purple
- `documentation` - Blue
- `improvement` - Indigo
- `performance` - Orange
- `security` - Red

Use the `color` prop:
```tsx
<TagBadge name="Critical Bug" color="bug" />
```

### Custom Classes
All components support Tailwind classes:
```tsx
<TagDisplay 
  tags={tags}
  className="gap-1 flex-wrap"
  variant="outline"
/>
```

## 🔗 Integration Points

### Work Item Creation
Tags field automatically added to `IssueCreateDialog.tsx`:
```tsx
<TagInput
  workspaceId={workspaceId}
  selectedTags={tags}
  onTagsChange={setTags}
  placeholder="Add tags..."
/>
```

### Kanban Board
Add to card components:
```tsx
<WorkItemTags 
  tags={item.tags}
  limit={2}
  editable={true}
  onEditTags={openManager}
/>
```

### Dashboard
Add filter and statistics:
```tsx
<TagFilterPanel {...props} />
<TagStatistics {...props} />
```

### Sprint Board
Same as Kanban board integration.

## 📖 Documentation

- **INTEGRATION_GUIDE.md** - Detailed component API and usage
- **IMPLEMENTATION_SUMMARY.md** - Overview of what was built
- **INTEGRATION_CHECKLIST.md** - Phase-by-phase integration tasks
- **TagsIntegrationExample.tsx** - Complete working example

## ✅ Features

- ✅ Display tags with styled badges
- ✅ Add/remove tags during work item creation
- ✅ Edit tags on existing work items
- ✅ Filter work items by tags
- ✅ Show tag usage statistics
- ✅ Create tags on-the-fly
- ✅ Batch tag operations
- ✅ Tag search and auto-suggest
- ✅ React Query caching
- ✅ TypeScript support
- ✅ Keyboard navigation
- ✅ Loading states
- ✅ Error handling
- ✅ Mobile responsive
- ✅ Accessibility

## 🛠️ Development

### Local Testing
```tsx
import { TagsIntegrationExample } from "@/components/issue/tags";

<TagsIntegrationExample workspaceId="ws-123" />
```

### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import { TagBadge } from '@/components/issue/tags';

test('renders tag name', () => {
  render(<TagBadge name="bug" />);
  expect(screen.getByText('bug')).toBeInTheDocument();
});
```

## 🚦 Status

- ✅ Core components created
- ✅ Hooks implemented
- ✅ IssueCreateDialog integrated
- ✅ Documentation complete
- 🔄 Ready for dashboard/board integration
- 🔄 Ready for filter integration

## 📦 Dependencies

All dependencies already in project:
- React 18.3.1+
- TypeScript 5.0+
- React Query 5.62.11+
- Axios 1.7.9+
- Radix UI Dialog
- Lucide React icons
- Tailwind CSS

**No new dependencies required!**

## 🔒 Security

- ✅ JWT authentication on all API calls
- ✅ Workspace-scoped queries only
- ✅ Role-based access control
- ✅ XSS protection via React
- ✅ MongoDB ObjectId validation

## 📊 Performance

- Debounced search (300ms)
- React Query caching (5min)
- Batch endpoints for multiple tags
- No performance impact on existing features

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎓 Learning Path

1. **Basics**: Read this README
2. **Integration**: Review INTEGRATION_GUIDE.md
3. **Examples**: Check TagsIntegrationExample.tsx
4. **Details**: Consult inline code comments
5. **Checklist**: Follow INTEGRATION_CHECKLIST.md

## 📞 Support

For questions or issues:
1. Check INTEGRATION_GUIDE.md
2. Review component prop documentation
3. See inline code comments
4. Check TagsIntegrationExample.tsx
5. Review test files for usage patterns

## 📄 License

Same as parent project

---

**Last Updated**: February 3, 2026
**Status**: Production Ready ✅
**Maintenance**: Stable
