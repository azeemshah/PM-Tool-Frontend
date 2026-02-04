import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { useCreateKanbanBoardLabel } from '@/api/kanban/hooks/labels/useCreateKanbanBoardLabel';
import { useDeleteKanbanBoardLabel } from '@/api/kanban/hooks/labels/useDeleteKanbanBoardLabel';
import { KanbanLabel } from '@/api/kanban/types';

interface LabelsSelectorProps {
  boardId: string;
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
  className?: string;
}

export function LabelsSelector({ boardId, selectedLabelIds, onChange, className }: LabelsSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');
  
  const { data: labels = [], isLoading } = useGetKanbanBoardLabels(boardId);
  const { mutate: createLabel, isPending: isCreating } = useCreateKanbanBoardLabel();
  const { mutate: deleteLabel } = useDeleteKanbanBoardLabel();

  const selectedLabelIdsRef = useRef(selectedLabelIds);
  selectedLabelIdsRef.current = selectedLabelIds;

  const [tempLabels, setTempLabels] = useState<KanbanLabel[]>([]);

  // Cleanup tempLabels that have arrived in labels
  useEffect(() => {
    if (tempLabels.length > 0 && labels.length > 0) {
      const labelIds = new Set(labels.map(l => l._id));
      // Also check by name/color just in case, but ID is the key
      setTempLabels(prev => prev.filter(l => !labelIds.has(l._id)));
    }
  }, [labels, tempLabels]);

  // Helper to get label object from ID
  const getLabel = (id: string) => {
    return labels.find(l => l._id === id) || tempLabels.find(l => l._id === id);
  };

  const selectedLabels = selectedLabelIds.map(getLabel).filter(Boolean) as KanbanLabel[];

  // Combine labels and tempLabels, deduplicating by ID
  const allLabels = Array.from(new Map([...labels, ...tempLabels].map(l => [l._id, l])).values());

  const handleUnselect = (labelId: string) => {
    onChange(selectedLabelIds.filter(id => id !== labelId));
  };

  const handleSelect = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      handleUnselect(labelId);
    } else {
      onChange([...selectedLabelIds, labelId]);
    }
    setSearchValue('');
    // Keep focus on input for multiple selection
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDeleteLabel = (labelId: string) => {
    deleteLabel({ boardId, labelId });
    // Also remove from selection if selected
    if (selectedLabelIds.includes(labelId)) {
      handleUnselect(labelId);
    }
    // Keep focus
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCreateLabel = () => {
    if (!searchValue.trim()) return;
    
    // Generate a random color
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const tempId = `temp-${Date.now()}`;
    const tempLabel = {
      _id: tempId,
      name: searchValue.trim(),
      color: randomColor,
      board: boardId
    };

    // Optimistically add label
    setTempLabels(prev => [...prev, tempLabel]);
    onChange([...selectedLabelIds, tempId]);
    setSearchValue('');

    createLabel({
      boardId,
      data: {
        name: tempLabel.name,
        color: tempLabel.color,
        board: boardId
      }
    }, {
      onSuccess: (newLabel) => {
        // Use ref to get latest selected IDs to avoid stale closure
        const currentIds = selectedLabelIdsRef.current;
        
        // Replace temp ID with real ID if it exists, otherwise just add real ID
        const newIds = currentIds.map(id => id === tempId ? newLabel._id : id);
        
        if (currentIds.includes(tempId)) {
             onChange(newIds);
        }

        // Update temp label to use real ID instead of removing it immediately
        // This ensures it stays visible until 'labels' query updates
        setTempLabels(prev => prev.map(l => l._id === tempId ? newLabel : l));

        // Ensure input keeps focus
        setTimeout(() => inputRef.current?.focus(), 0);
      },
      onError: () => {
        // Revert optimistic update
        const currentIds = selectedLabelIdsRef.current;
        onChange(currentIds.filter(id => id !== tempId));
        setTempLabels(prev => prev.filter(l => l._id !== tempId));
      }
    });
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchValue.trim()) {
          // Check if label already exists (case-insensitive)
          const existingLabel = allLabels.find(l => l.name.toLowerCase() === searchValue.trim().toLowerCase());
          if (existingLabel) {
              handleSelect(existingLabel._id);
          } else {
              handleCreateLabel();
          }
      }
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (searchValue === '' && selectedLabelIds.length > 0) {
        handleUnselect(selectedLabelIds[selectedLabelIds.length - 1]);
      }
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div 
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div
        className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex flex-wrap gap-1 bg-background"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedLabels.map((label) => (
          <Badge key={label._id} variant="secondary" className="mr-1 hover:bg-secondary/80 cursor-default pr-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {label.name}
            <button
              type="button"
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnselect(label._id);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(label._id)}
            >
              <X className="h-3 w-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedLabels.length > 0 ? "" : "Select multiple Labels"}
          className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[100px] text-sm"
        />
      </div>
    </div>
  );
}
