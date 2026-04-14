import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useGetKanbanBoardLabels } from '@/api/kanban/hooks/labels/useGetKanbanBoardLabels';
import { useCreateKanbanBoardLabel } from '@/api/kanban/hooks/labels/useCreateKanbanBoardLabel';
import { useDeleteKanbanBoardLabel } from '@/api/kanban/hooks/labels/useDeleteKanbanBoardLabel';
import { useUpdateKanbanBoardLabel } from '@/api/kanban/hooks/labels/useUpdateKanbanBoardLabel';
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
  const { mutate: updateLabel } = useUpdateKanbanBoardLabel();

  const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
  ];
  const [selectedColor, setSelectedColor] = useState(COLORS[4]);

  const selectedLabelIdsRef = useRef(selectedLabelIds);
  selectedLabelIdsRef.current = selectedLabelIds;

  const [tempLabels, setTempLabels] = useState<KanbanLabel[]>([]);

  // Cleanup tempLabels that have arrived in labels with matching data
  useEffect(() => {
    if (tempLabels.length > 0 && labels.length > 0) {
      setTempLabels(prev => {
        const next = prev.filter(l => {
          const serverLabel = labels.find(sl => sl._id === l._id);
          if (!serverLabel) return true; // Not in server yet, keep

          // In server, check if data matches
          // If server matches local (color & name), we can remove local.
          // If server is different (e.g. old color), keep local to override.
          if (serverLabel.color === l.color && serverLabel.name === l.name) {
            return false; // Remove
          }
          return true; // Keep
        });

        return next.length === prev.length ? prev : next;
      });
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

    // Use selected color
    const colorToUse = selectedColor;

    const tempId = `temp-${Date.now()}`;
    const tempLabel = {
      _id: tempId,
      name: searchValue.trim(),
      color: colorToUse,
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
          // If user selected a color different from existing label, update it
          if (existingLabel.color !== selectedColor) {
            // Optimistic update
            const updatedLabel = { ...existingLabel, color: selectedColor };
            setTempLabels(prev => {
              const filtered = prev.filter(l => l._id !== existingLabel._id);
              return [...filtered, updatedLabel];
            });

            updateLabel({
              boardId,
              labelId: existingLabel._id,
              data: { color: selectedColor }
            });
          }
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
          <Badge
            key={label._id}
            variant="secondary"
            className="mr-1 hover:opacity-80 cursor-default pr-1 text-white"
            style={{ backgroundColor: label.color || '#3b82f6' }}
          >
            {label.name}
            <button
              type="button"
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-white/20 p-0.5"
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
              <X className="h-3 w-3 text-white" />
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

      {/* Color Picker for new label */}
      {searchValue && (
        <div className="flex gap-2 mt-2 px-1 items-center">
          <span className="text-xs text-muted-foreground">Select Color:</span>
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all",
                selectedColor === color ? "border-black dark:border-white scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
