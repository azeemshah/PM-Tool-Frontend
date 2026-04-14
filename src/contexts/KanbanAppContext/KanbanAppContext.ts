import { createContext } from 'react';
import { KanbanBoard, KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';

export interface KanbanAppContextType {
  // Board state
  selectedBoard: KanbanBoard | null;
  setSelectedBoard: (board: KanbanBoard | null) => void;

  // Card state
  selectedCard: KanbanCard | Issue | null;
  setSelectedCard: (card: KanbanCard | Issue | null) => void;

  // Dialog state
  isCardDialogOpen: boolean;
  setIsCardDialogOpen: (open: boolean) => void;

  // Issue Create Dialog state
  isIssueCreateDialogOpen: boolean;
  setIsIssueCreateDialogOpen: (open: boolean) => void;
  selectedColumnName: string | null;
  setSelectedColumnName: (columnName: string | null) => void;

  // Filter and search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sidebar state
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  // View mode
  viewMode: 'board' | 'list' | 'calendar';
  setViewMode: (mode: 'board' | 'list' | 'calendar') => void;
}

export const KanbanAppContext = createContext<KanbanAppContextType | undefined>(undefined);





