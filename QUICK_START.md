# Quick Start - Visual Guide

## 🎯 5-Minute Integration

### Step 1: Import Components
```typescript
import { IssueCreateDialog } from '@/components/issue';
import { useIssueCreateDialog } from '@/hooks/useIssueCreateDialog';
```

### Step 2: Add to Your Component
```typescript
export function MyBoard() {
  const dialogState = useIssueCreateDialog();
  const projectId = 'proj-123';
  const workspaceId = 'ws-123';

  return (
    <>
      {/* Your existing board content */}
      
      {/* Add this button */}
      <button onClick={() => dialogState.open(projectId, workspaceId)}>
        + New Issue
      </button>
      
      {/* Add this dialog */}
      <IssueCreateDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => open ? dialogState.open(projectId, workspaceId) : dialogState.close()}
        projectId={dialogState.projectId || projectId}
        workspaceId={dialogState.workspaceId || workspaceId}
      />
    </>
  );
}
```

Done! ✅

---

## 📊 Hierarchy at a Glance

```
🎯 EPIC (Top Level)
├── 📖 STORY (children: Subtask)
├── ✓ TASK (children: Subtask) [NEW: Now under Epic]
└── 🐛 BUG (children: Subtask) [NEW: Now under Epic]
    └── → SUBTASK (under any Story/Task/Bug)
```

---

## 🔧 Common Operations

### Create Epic
```typescript
const { mutate } = useCreateEpic();
mutate({ projectId: 'p1', title: 'Auth', reporter: 'u1' });
```

### Create Story Under Epic
```typescript
const { mutate } = useCreateStory();
mutate({ epicId: 'ep1', data: { projectId: 'p1', title: 'Login', reporter: 'u1' } });
```

### Create Task Under Epic
```typescript
const { mutate } = useCreateTask();
mutate({ epicId: 'ep1', data: { projectId: 'p1', title: 'DB Setup', reporter: 'u1' } });
```

### Get Epics
```typescript
const { data: epics } = useGetEpics(projectId);
```

### Get Epic Children
```typescript
const { data: children } = useGetEpicChildren(epicId);
```

---

## 🎨 Display Issues

```typescript
import { IssueCard } from '@/components/issue/examples/IssueCardDisplay';

function IssueList({ issues }) {
  return (
    <div className="space-y-2">
      {issues.map(issue => (
        <IssueCard key={issue._id} issue={issue} />
      ))}
    </div>
  );
}
```

---

## 📝 Type Safety

```typescript
import type { Epic, Story, Task, Bug, Subtask } from '@/api/issue/types';

// ✅ Story MUST have epicId
const story: Story = {
  type: 'story',
  epicId: 'ep1', // Required!
  projectId: 'p1',
  title: 'Login',
  reporter: 'user1'
};

// ❌ Won't compile without epicId
const invalid: Story = {
  type: 'story',
  projectId: 'p1',
  title: 'Login',
  reporter: 'user1'
  // Missing epicId - TypeScript error!
};
```

---

## 📁 Files Overview

```
src/api/issue/
├── types/          ← Issue, Epic, Story, Task, Bug, Subtask types
├── services/       ← API calls
├── hooks/          ← React hooks (10 total)
└── README.md       ← Integration guide

src/components/issue/
├── IssueTypeSelector.tsx      ← Type dropdown
├── ParentSelector.tsx         ← Smart parent selection
├── IssueCreateDialog.tsx      ← Complete form
└── examples/                  ← Working examples

src/hooks/
└── useIssueCreateDialog.ts    ← Dialog state
```

---

## ✅ Quick Checklist

- [ ] Copy all 20 files
- [ ] Import IssueCreateDialog
- [ ] Add to your component
- [ ] Test create button
- [ ] Test Epic creation
- [ ] Test Story creation
- [ ] Test Task creation (now under Epic)
- [ ] Test Bug creation (now under Epic)
- [ ] Test Subtask creation
- [ ] Verify error messages
- [ ] Check type safety with TypeScript

---

## 🎉 You're Done!

That's all you need to implement the new Issue hierarchy. The dialog handles everything:
- ✅ Type selection
- ✅ Parent selection
- ✅ Validation
- ✅ Error handling
- ✅ Toast notifications

---

## 📞 Need Help?

**Files to Read:**
1. `FRONTEND_MIGRATION_COMPLETE.md` - Overview
2. `src/api/issue/README.md` - Integration guide
3. `src/components/issue/examples/` - Working examples

**Common Questions:**
- "How do I display issues?" → See `IssueCardDisplay.tsx`
- "How do I create tasks?" → See examples above
- "What types are available?" → See `src/api/issue/types/index.ts`

---

**Status:** ✅ COMPLETE & READY TO USE
**All Files:** ✅ IN PLACE
**Documentation:** ✅ COMPREHENSIVE
**Examples:** ✅ PROVIDED

🚀 Happy Coding!
