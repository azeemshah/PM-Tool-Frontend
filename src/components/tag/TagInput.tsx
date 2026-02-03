import React, { useState, useEffect, useRef } from "react";
import { X, Check, Plus } from "lucide-react";
import useTags from "@/hooks/api/use-tags";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface TagInputProps {
  workspaceId: string;
  selectedTags: string[]; // Array of tag IDs
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface TagOption {
  _id: string;
  name: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  workspaceId,
  selectedTags,
  onTagsChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<TagOption[]>([]);
  const [selectedTagObjects, setSelectedTagObjects] = useState<TagOption[]>([]);
  
  const { searchTags, getAllTagsByWorkspace, getTagsByIds, createTag } = useTags();

  // Keep track of recently created tags to bridge the gap between creation and server sync
  const pendingTagsRef = useRef<Map<string, TagOption>>(new Map());

  // Debounce input
  const [debouncedInput, setDebouncedInput] = useState(inputValue);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Queries
  const allTagsQuery = getAllTagsByWorkspace(workspaceId);
  const searchQuery = searchTags(workspaceId, debouncedInput, 10);
  
  // Filter out temp IDs for server query to avoid errors
  const serverQueryTags = selectedTags.filter(id => !id.startsWith("temp-"));
  const tagsByIdsQuery = getTagsByIds(serverQueryTags);

  // Sync selected tag objects
  useEffect(() => {
    // We always want to reconstruct selectedTagObjects based on selectedTags prop
    // using available data sources: Server Data, Local State (prev), and Pending Cache
    setSelectedTagObjects((prev) => {
      const serverTags = (tagsByIdsQuery.data as TagOption[]) || [];
      const serverTagMap = new Map(serverTags.map((t) => [t._id, t]));
      
      const newSelectedObjects: TagOption[] = [];
      
      selectedTags.forEach(id => {
          // 1. Try Server Data
          if (serverTagMap.has(id)) {
              newSelectedObjects.push(serverTagMap.get(id)!);
          } else {
              // 2. Try Pending Cache (recently created tags)
              if (pendingTagsRef.current.has(id)) {
                  newSelectedObjects.push(pendingTagsRef.current.get(id)!);
              } else {
                  // 3. Try Existing Local State
                  const local = prev.find(t => t._id === id);
                  if (local) {
                      newSelectedObjects.push(local);
                  }
              }
          }
      });
      
      return newSelectedObjects;
    });
  }, [tagsByIdsQuery.data, selectedTags]);

  // Sync suggestions
  useEffect(() => {
    if (debouncedInput.trim().length === 0) {
      setSuggestedTags(allTagsQuery.data || []);
    } else {
      setSuggestedTags(searchQuery.data || []);
    }
  }, [debouncedInput, searchQuery.data, allTagsQuery.data]);

  const handleUnselect = (tagId: string) => {
    const newTags = selectedTags.filter((id) => id !== tagId);
    onTagsChange(newTags);
    setSelectedTagObjects(selectedTagObjects.filter((tag) => tag._id !== tagId));
  };

  const handleSelect = (tag: TagOption) => {
    if (selectedTags.includes(tag._id)) {
      handleUnselect(tag._id);
    } else {
      onTagsChange([...selectedTags, tag._id]);
      setSelectedTagObjects([...selectedTagObjects, tag]);
    }
    setInputValue("");
    // Keep focus
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCreateNewTag = async () => {
    if (inputValue.trim().length === 0) return;
    
    const name = inputValue.trim();
    // Check if already exists in suggestions to avoid duplicates
    const existing = suggestedTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        handleSelect(existing);
        return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempTag: TagOption = { _id: tempId, name };

    // Optimistic add
    const newTagsIds = [...selectedTags, tempId];
    const newTagObjects = [...selectedTagObjects, tempTag];
    onTagsChange(newTagsIds);
    setSelectedTagObjects(newTagObjects);
    setInputValue("");
    
    try {
      const newTag = await createTag.mutateAsync({ name, workspaceId });
      if (newTag) {
         // Update IDs - need to use latest state or functional update if possible, 
         // but here we are in a closure. Ideally we should use functional update for parent if supported,
         // but onTagsChange is (tags: string[]) => void.
         // We'll just trigger onTagsChange again with the new ID replacing the temp ID.
         // Wait, if user added more tags in between?
         // This is a common issue. 
         // For now, let's assume simple sequential usage.
         
         // Better approach: Since we don't control the parent state fully, we just hope the parent 
         // updates `selectedTags` prop correctly.
         
         // We need to call onTagsChange with the corrected list.
         // We can't know if the user added another tag while this was flying.
         // But usually creating a tag is fast.
         
         // A safer way:
         // We already called onTagsChange with tempId.
         // Now we call it with newTag._id replacing tempId.
         // But we need the CURRENT selectedTags.
         // Since `handleCreateNewTag` is async, `selectedTags` might be stale?
         // `selectedTags` is from props, so it changes on re-render.
         // But inside this async function, `selectedTags` is closed over.
         // Using a ref for selectedTags would solve this.
      }
    } catch (error) {
       console.error("Failed to create tag", error);
       handleUnselect(tempId);
    }
  };

  // Use ref for selectedTags to access latest in async callbacks if needed
  const selectedTagsRef = useRef(selectedTags);
  selectedTagsRef.current = selectedTags;

  const handleCreateNewTagSafe = async () => {
    if (inputValue.trim().length === 0) return;
    
    const name = inputValue.trim();
    const existing = suggestedTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        handleSelect(existing);
        return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempTag: TagOption = { _id: tempId, name };

    // Optimistic add using current prop
    const currentTags = selectedTagsRef.current;
    onTagsChange([...currentTags, tempId]);
    setSelectedTagObjects(prev => [...prev, tempTag]);
    setInputValue("");
    setOpen(true);

    try {
      const newTag = await createTag.mutateAsync({ name, workspaceId });
      if (newTag) {
         console.log("Tag created on server:", newTag);
         // Store in pending cache for seamless transition
         pendingTagsRef.current.set(newTag._id, newTag);

         // Update IDs
         const latestTags = selectedTagsRef.current;
         const updatedTags = latestTags.map(id => id === tempId ? newTag._id : id);
         onTagsChange(updatedTags);
         
         // We rely on useEffect to update selectedTagObjects now that we have the data in pendingTagsRef
      }
    } catch (error) {
       console.error("Failed to create tag", error);
       // show quick feedback
       try {
         // friendly alert for now; UI toast can be used later
         alert("Failed to create tag: " + (error?.message || "unknown error"));
       } catch (e) {}
       // Revert
       const latestTags = selectedTagsRef.current;
       onTagsChange(latestTags.filter(id => id !== tempId));
       setSelectedTagObjects(prev => prev.filter(t => t._id !== tempId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Enter") {
        if (inputValue && inputValue.trim().length > 0) {
          e.preventDefault();
          // trigger create
          void handleCreateNewTagSafe();
          return;
        }
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (input.value === "" && selectedTags.length > 0) {
          handleUnselect(selectedTags[selectedTags.length - 1]);
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  const showCreateOption = inputValue.trim() && !suggestedTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
      shouldFilter={false} // We filter manually via API/Suggestions
    >
      <div
        className={cn(
            "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex flex-wrap gap-1 bg-background",
            disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTagObjects.map((tag) => (
          <Badge key={tag._id} variant="secondary" className="mr-1 hover:bg-secondary/80 cursor-default pr-1">
            {tag.name}
            <button
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnselect(tag._id);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(tag._id)}
              disabled={disabled}
            >
              <X className="h-3 w-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
            </button>
          </Badge>
        ))}
        <CommandPrimitive.Input
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          placeholder={selectedTagObjects.length > 0 ? "" : placeholder}
          disabled={disabled}
          className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[100px]"
        />
      </div>

      {open && (
        <div className="relative mt-2">
            <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                <CommandList>
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {showCreateOption && (
                            <CommandItem
                                value={`Create ${inputValue}`}
                                onSelect={handleCreateNewTagSafe}
                                className="cursor-pointer font-medium text-blue-600 dark:text-blue-400"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create "{inputValue}"
                            </CommandItem>
                        )}
                        {suggestedTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag._id);
                            return (
                                <CommandItem
                                    key={tag._id}
                                    value={tag.name}
                                    onSelect={() => handleSelect(tag)}
                                    className="cursor-pointer"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        {tag.name}
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 mr-2" />}
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
};

export default TagInput;
