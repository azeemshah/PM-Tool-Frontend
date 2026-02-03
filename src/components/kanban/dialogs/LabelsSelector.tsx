import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
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
  const [open, setOpen] = useState(false);
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

  // Filter labels based on search value
  const filteredLabels = allLabels.filter(label => 
    label.name.toLowerCase().includes(searchValue.trim().toLowerCase())
  );

  const showCreateOption = searchValue.trim() && !allLabels.some(l => l.name.toLowerCase() === searchValue.trim().toLowerCase());

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


  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (input.value === '' && selectedLabelIds.length > 0) {
          handleUnselect(selectedLabelIds[selectedLabelIds.length - 1]);
        }
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    }
  };

  return (
    <Command 
      onKeyDown={handleKeyDown} 
      className={cn("overflow-visible bg-transparent", className)}
      shouldFilter={false}
    >
      <div
        className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex flex-wrap gap-1 bg-background"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedLabels.map((label) => (
          <Badge key={label._id} variant="secondary" className="mr-1 hover:bg-secondary/80 cursor-default pr-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {label.name}
            <button
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
        <CommandPrimitive.Input
          ref={inputRef}
          value={searchValue}
          onValueChange={setSearchValue}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          placeholder={selectedLabels.length > 0 ? "" : "Select multiple Labels"}
          className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[100px]"
        />
      </div>
      
      {open && (
        <div className="relative mt-2">
            <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                <CommandList>
                    <CommandEmpty>No labels found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {showCreateOption && (
                             <CommandItem
                                value={`Create ${searchValue}`}
                                onSelect={() => handleCreateLabel()}
                                className="cursor-pointer font-medium text-blue-600 dark:text-blue-400"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                             >
                                <Plus className="mr-2 h-4 w-4" />
                                Create "{searchValue}"
                             </CommandItem>
                        )}
                        {filteredLabels.map((label) => {
                            const isSelected = selectedLabelIds.includes(label._id);
                            return (
                                <CommandItem
                                    key={label._id}
                                    value={label.name}
                                    onSelect={() => {
                                        handleSelect(label._id);
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                    }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: label.color || '#666' }} 
                                        />
                                        {label.name}
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 mr-2" />}
                                    <button
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-opacity"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteLabel(label._id);
                                        }}
                                        title="Delete label"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </CommandList>
            </div>
        </div>
      )}
    </Command>
  );
}
