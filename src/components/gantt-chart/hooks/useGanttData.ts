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
      const response = await API.get(`/items/workspace/${workspaceId}`);
      const items = (response.data?.data || response.data) as GanttItem[];

      // Filter to only include items with startDate or dueDate
      const validItems = items.filter((item) => item.startDate || item.dueDate);

      // Build tree structure
      const tree = buildHierarchyTree(validItems);

      return {
        items: validItems,
        tree,
        totalCount: items.length,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!workspaceId,
  });

  return {
    items: data?.items || [],
    tree: data?.tree || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
