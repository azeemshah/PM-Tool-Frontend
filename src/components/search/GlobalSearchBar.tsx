import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, HelpCircle, Timer, View, AlertCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/axios-client';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText, transformStatusEnum } from '@/lib/helper';
import { Badge } from '@/components/ui/badge';
import { TaskStatusEnum, TaskPriorityEnum } from '@/constant';
import { getStatusIcon } from '@/components/workspace/task/table/data';
import { getGanttStatusColor } from '@/components/gantt-chart/utils/colorMaps';
import './global-search-bar.css';

interface SearchResult {
  _id: string;
  title: string;
  description?: string;
  type: 'story' | 'bug' | 'task' | 'epic' | 'subtask';
  priority?: string;
  status?: string;
  workspaceId?: string;
  assignedTo?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  workspace?: {
    _id: string;
    name: string;
  };
  tags?: Array<{
    _id: string;
    name: string;
    color?: string;
  }>;
  createdAt?: string;
}

interface GlobalSearchBarProps {
  placeholder?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = 'Search work items...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch search results
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['globalSearch', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        return [];
      }
      try {
        console.log('Fetching global search for:', debouncedSearchTerm);
        const response = await API.get(
          `/pm-items/search/global/${encodeURIComponent(debouncedSearchTerm)}`
        );
        console.log('Search response:', response.data);
        const results = response.data?.data || [];
        console.log('Results count:', results.length);
        return results;
      } catch (error) {
        console.error('Search failed:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        // Log the full error for debugging
        console.error('Full error:', error);
        return [];
      }
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    // Try to get workspace ID from multiple sources
    const workspaceId = 
      result.workspaceId || 
      (typeof result.workspace === 'string' ? result.workspace : result.workspace?._id);

    if (!workspaceId) {
      console.warn('No workspace ID found for work item:', result._id);
      return;
    }

    navigate(`/workspace/${workspaceId}/work-item/${result._id}`, {
      state: { workItem: result },
    });
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const getPriorityVariant = (priority?: string) => {
    if (!priority) return 'outline';
    const priorityMap: { [key: string]: string } = {
      'LOW': TaskPriorityEnum.LOW,
      'MEDIUM': TaskPriorityEnum.MEDIUM,
      'HIGH': TaskPriorityEnum.HIGH,
      'low': TaskPriorityEnum.LOW,
      'medium': TaskPriorityEnum.MEDIUM,
      'high': TaskPriorityEnum.HIGH,
    };
    return priorityMap[priority] || 'outline';
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return undefined;
    const normalizedPriority = priority.toUpperCase();
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'LOW': ArrowDown,
      'MEDIUM': ArrowRight,
      'HIGH': ArrowUp,
    };
    return iconMap[normalizedPriority];
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (debouncedSearchTerm.length >= 2 || searchResults.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto scrollbar"
        >
          {isLoading && debouncedSearchTerm.length >= 2 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500 dark:text-red-400 px-4">
              <p>Error fetching results</p>
              <p className="text-xs mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="py-2">
              {searchResults.map((result: SearchResult) => (
                <li key={result._id}>
                  <button
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b dark:border-gray-700 last:border-b-0"
                  >
                    {/* Left: Icon and Title */}
                    <div className="flex-shrink-0">
                      <IssueTypeIcon type={result.type} size={16} />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {typeof result.workspace === 'string'
                            ? result.workspace
                            : result.workspace?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.status && (() => {
                          const colors = getGanttStatusColor(result.status);
                          const StatusIcon = getStatusIcon(result.status);
                          return (
                            <Badge
                              variant="outline"
                              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium shadow-sm uppercase border-0 ${colors.bg} ${colors.text}`}
                            >
                              {StatusIcon && <StatusIcon className="h-4 w-4 rounded-full text-inherit" />}
                              <span>{transformStatusEnum(result.status)}</span>
                            </Badge>
                          );
                        })()}
                        {result.priority && (
                          <Badge
                            variant={getPriorityVariant(result.priority) as any}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium shadow-sm uppercase border-0"
                          >
                            {getPriorityIcon(result.priority) && React.createElement(getPriorityIcon(result.priority)!, { className: 'h-4 w-4 rounded-full text-inherit' })}
                            <span>{result.priority}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right: Assignee Avatar */}
                    {result.assignedTo && (
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={getProfileImageUrl(result.assignedTo?.profilePicture)}
                          />
                          <AvatarFallback
                            style={{
                              backgroundColor: getAvatarColor(
                                result.assignedTo?.name || ''
                              ),
                            }}
                          >
                            {getAvatarFallbackText(
                              result.assignedTo?.name || ''
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedSearchTerm.length >= 2 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No work items found</p>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>Type to search across all workspaces</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
