import { useState, useMemo } from 'react';
import type { GanttItem, GanttFilters, GanttTreeNode } from '../types/gantt';

/**
 * Hook to manage Gantt chart filters
 */
export function useGanttFilters(nodes: GanttTreeNode[]) {
  const [filters, setFilters] = useState<GanttFilters>({});

  const filteredNodes = useMemo(() => {
    return filterTreeNodes(nodes, filters);
  }, [nodes, filters]);

  const updateFilter = (key: keyof GanttFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    filteredNodes,
  };
}

/**
 * Filter tree nodes based on criteria
 * Keeps parent items even if only child matches filter
 */
function filterTreeNodes(
  nodes: GanttTreeNode[],
  filters: GanttFilters
): GanttTreeNode[] {
  function itemMatches(item: GanttItem): boolean {
    // Check status filter (support both singular and plural)
    const statuses = filters.statuses || filters.status;
    if (statuses && !statuses.includes(item.status)) {
      return false;
    }

    // Check assignee filter (support both singular and plural)
    const assignees = filters.assignees || filters.assignee;
    if (
      assignees &&
      !assignees.includes(item.assignedTo?._id || 'unassigned')
    ) {
      return false;
    }

    // Check type filter (support both singular and plural)
    const types = filters.types || filters.type;
    if (types && !types.includes(item.type)) {
      return false;
    }

    // Check search text
    if (filters.searchText) {
      const text = filters.searchText.toLowerCase();
      if (!item.title.toLowerCase().includes(text)) {
        return false;
      }
    }

    return true;
  }

  function traverse(node: GanttTreeNode): GanttTreeNode | null {
    const matches = itemMatches(node.item);
    const filteredChildren = node.children
      .map(traverse)
      .filter((n): n is GanttTreeNode => n !== null);

    // Keep node if it matches OR if any child matches
    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  }

  return nodes
    .map(traverse)
    .filter((n): n is GanttTreeNode => n !== null);
}
