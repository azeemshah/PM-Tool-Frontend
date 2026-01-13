import { createContext } from 'react';
import { ScrumboardBoard, ScrumboardCard } from '@/api/scrumboard/types';

export interface ScrumboardAppContextType {
  // Board state
  selectedBoard: ScrumboardBoard | null;
  setSelectedBoard: (board: ScrumboardBoard | null) => void;

  // Card state
  selectedCard: ScrumboardCard | null;
  setSelectedCard: (card: ScrumboardCard | null) => void;

  // Dialog state
  isCardDialogOpen: boolean;
  setIsCardDialogOpen: (open: boolean) => void;

  // Issue Create Dialog state
  isIssueCreateDialogOpen: boolean;
  setIsIssueCreateDialogOpen: (open: boolean) => void;
  issueCreateProjectId: string | null;
  setIssueCreateProjectId: (projectId: string | null) => void;

  // Project selection state
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;

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

export const ScrumboardAppContext = createContext<ScrumboardAppContextType | undefined>(undefined);
