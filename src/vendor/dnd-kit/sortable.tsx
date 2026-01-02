import React from 'react';

export const SortableContext: React.FC<any> = ({ children }) => {
  return <>{children}</>;
};

export const arrayMove = (array: any[], from: number, to: number) => {
  const arr = array.slice();
  const val = arr.splice(from, 1)[0];
  arr.splice(to, 0, val);
  return arr;
};

export const verticalListSortingStrategy = 'vertical';
export const horizontalListSortingStrategy = 'horizontal';

export const useSortable = ({ id }: { id: any }) => {
  const setNodeRef = (el: any) => {};
  const attributes = {};
  const listeners = {};
  const transform = null;
  const transition = undefined;
  const isDragging = false;
  return { attributes, listeners, setNodeRef, transform, transition, isDragging };
};
