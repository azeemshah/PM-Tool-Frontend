import { useQuery } from '@tanstack/react-query';
import type { GanttItem } from '../types/gantt';
import { buildHierarchyTree } from '../utils/hierarchyBuilder';
import API from '@/lib/axios-client';

/**
 * Hook to fetch and transform workspace items into Gantt data
 */
export function useGanttData(workspaceId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gantt-data', workspaceId],
    queryFn: async () => {
      // Fetch all workspace items and specifically subtasks to ensure coverage
      const [response, subtasksResponse] = await Promise.all([
        API.get(`/items/workspace/${workspaceId}`),
        API.get(`/items/workspace/${workspaceId}`, { params: { type: 'subtask' } })
      ]);

      const mainItems = (response.data?.data || response.data) as GanttItem[];
      const subtaskItems = (subtasksResponse.data?.data || subtasksResponse.data) as GanttItem[];

      // Merge items, preferring mainItems if duplicates exist
      const itemMap = new Map<string, GanttItem>();
      mainItems.forEach(item => itemMap.set(item._id, item));
      subtaskItems.forEach(item => {
        if (!itemMap.has(item._id)) {
          itemMap.set(item._id, item);
        }
      });

      const items = Array.from(itemMap.values());

      // Filter to only include items with startDate or dueDate, or subtasks (which might inherit dates)
      // Also recursively include parents of valid items to ensure hierarchy is preserved
      const allItemsMap = new Map(items.map(i => [i._id, i]));
      const includedIds = new Set<string>();

      // Initial pass: items with dates or subtasks
      items.forEach(item => {
        if (item.startDate || item.dueDate || item.type === 'subtask') {
          includedIds.add(item._id);
        }
      });

      // Recursive pass: include parents
      let changed = true;
      while (changed) {
        changed = false;
        // Check parents of all currently included items
        const currentIds = Array.from(includedIds);
        for (const id of currentIds) {
          const item = allItemsMap.get(id);
          if (item && item.parent) {
            const parentId = typeof item.parent === 'object' && '_id' in item.parent
              ? (item.parent as any)._id
              : item.parent;

            if (parentId && !includedIds.has(parentId) && allItemsMap.has(parentId)) {
              includedIds.add(parentId);
              changed = true;
            }
          }
        }
      }

      const validItems = items.filter((item) => includedIds.has(item._id));

      // Build tree structure
      const tree = buildHierarchyTree(validItems);

      return {
        items: validItems,
        tree,
        totalCount: items.length,
      };
    },
    staleTime: 0, // Enable instant real-time updates
    gcTime: 5 * 60 * 1000,
    enabled: !!workspaceId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    items: data?.items || [],
    tree: data?.tree || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
