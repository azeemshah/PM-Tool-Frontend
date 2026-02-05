import type { GanttItem, GanttTreeNode } from '../types/gantt';

/**
 * Build tree structure from flat array of items
 * Respects parent-child relationships using the 'parent' field
 */
export function buildHierarchyTree(items: GanttItem[]): GanttTreeNode[] {
  // Create a map for quick lookup
  const itemMap = new Map<string, GanttItem>();
  items.forEach((item) => {
    itemMap.set(item._id, item);
  });

  // Initialize all nodes
  const nodeMap = new Map<string, GanttTreeNode>();
  items.forEach((item) => {
    nodeMap.set(item._id, {
      item,
      children: [],
      level: 0,
      isExpanded: item.type === 'epic',
      barStart: 0,
      barWidth: 0,
      progressPercent: 0,
    });
  });

  // Build relationships
  const rootNodes: GanttTreeNode[] = [];
  items.forEach((item) => {
    const node = nodeMap.get(item._id)!;

    if (item.parent) {
      // Handle both string ID and populated object
      const parentId = typeof item.parent === 'object' && '_id' in item.parent 
        ? (item.parent as any)._id 
        : item.parent;

      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      } else {
        // Orphaned item, treat as root
        rootNodes.push(node);
      }
    } else {
      // Root item
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * Filter visible nodes based on expansion state
 */
export function getVisibleNodes(nodes: GanttTreeNode[]): GanttTreeNode[] {
  const visible: GanttTreeNode[] = [];

  function traverse(node: GanttTreeNode) {
    visible.push(node);
    if (node.isExpanded && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return visible;
}

/**
 * Find node by ID (deep search)
 */
export function findNodeById(
  nodes: GanttTreeNode[],
  id: string
): GanttTreeNode | null {
  for (const node of nodes) {
    if (node.item._id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Toggle expansion of a node
 */
export function toggleNodeExpansion(
  nodes: GanttTreeNode[],
  id: string
): GanttTreeNode[] {
  const node = findNodeById(nodes, id);
  if (node) {
    node.isExpanded = !node.isExpanded;
  }
  return [...nodes];
}
