# Epic Dropdown Debug Guide

## What to Look For in Browser Console Logs

### 1. **When the dialog opens and Story is selected:**
Look for these console logs in order:

```
🔍 IssueCreateDialog Debug: {
  selectedProjectId: "695e104dde45e42e5a818968",
  projectId: "695e104dde45e42e5a818968",
  epicsQueryKey: ["epics", "695e104dde45e42e5a818968"],
  epicsQueryLoading: false,
  epicsQueryError: null,
  epicsData: [Array of epic objects],
  epics: [Array of epic objects],
  epicCount: X  // Should be > 0
}
```

### 2. **In useGetEpics hook:**
You should see:

```
📡 useGetEpics called with projectId: "695e104dde45e42e5a818968"
📡 useGetEpics - queryFn executing with projectId: "695e104dde45e42e5a818968"
```

### 3. **In API Service:**
You should see:

```
📤 getEpicsByProject - fetching from URL: /issues/epic/695e104dde45e42e5a818968
📥 getEpicsByProject - response: {object with epics}
📥 getEpicsByProject - extracted data: [Array]
📥 getEpicsByProject - returning: [Array of epics]
```

### 4. **In ParentSelector:**
You should see:

```
🔍 ParentSelector Debug: {
  issueType: "story",
  projectId: "695e104dde45e42e5a818968",
  parentLabel: "Epic",
  epicsLoading: false,
  epicsData: [Array of epics],
  epicCount: X  // Should be > 0
}
```

## Steps to Test

### Test 1: Dashboard Page
1. Open `http://localhost:5173/`
2. Navigate to a project's Dashboard
3. Click "Create Issue" button
4. Select "Story" in Issue Type dropdown
5. **Check Console Logs** - You should see all 4 sets of logs above
6. The Epic dropdown should now show available epics (not "No Epics available")

### Test 2: All Tasks Page
1. Navigate to the "All Tasks" or "All Issues" page
2. Click "Create Issue" button
3. Select a project if prompted
4. Select "Story" in Issue Type dropdown
5. **Check Console Logs** - Same logs should appear
6. The Epic dropdown should show available epics

## Common Issues and Solutions

### Issue: "No Epics available" message appears
**Check Console Logs for:**
- Is `selectedProjectId` empty or "default"?
- Is the API URL correct in 📤 log?
- Is the API returning data in 📥 log?
- Is `epicCount` showing 0?

### Issue: epicsQueryKey shows null
**Likely Cause:** `selectedProjectId` is not being set properly
- Check if the dialog received a valid `projectId` prop
- Verify the project has epics created

### Issue: API returns error
**Look for error in 📥 log:**
- Check network tab in DevTools for 404 or 500 errors
- Verify projectId is a valid MongoDB ObjectId
- Check backend is running

## Browser DevTools Tips

1. **Open DevTools:** F12 or Right-click → Inspect
2. **Go to Console Tab:** Click "Console" at the top
3. **Filter logs:** Type "🔍" or "📡" in the filter box
4. **Clear logs:** Click the circle with slash icon

## Expected vs Actual

### ✅ Expected (Working)
- Logs show valid projectId throughout the chain
- epicsData contains an array of epic objects
- epicCount > 0
- ParentSelector receives projectId and shows epics

### ❌ Actual (Not Working)
- selectedProjectId is empty or "default"
- epicsData is empty array []
- epicCount = 0
- ParentSelector shows "No Epics available"
