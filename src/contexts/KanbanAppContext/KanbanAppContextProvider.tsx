import { ReactNode, useState } from 'react';
import { KanbanAppContext, KanbanAppContextType } from './KanbanAppContext';
import { KanbanBoard, KanbanCard } from '@/api/kanban/types';
import { Issue } from '@/api/issue/types';

interface KanbanAppContextProviderProps {
  children: ReactNode;
}

export function KanbanAppContextProvider({
  children,
}: KanbanAppContextProviderProps) {
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | Issue | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isIssueCreateDialogOpen, setIsIssueCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');

  const value: KanbanAppContextType = {
    selectedBoard,
    setSelectedBoard,
    selectedCard,
    setSelectedCard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    isIssueCreateDialogOpen,
    setIsIssueCreateDialogOpen,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    viewMode,
    setViewMode,
  };

  return (
    <KanbanAppContext.Provider value={value}>
      {children}
    </KanbanAppContext.Provider>
  );
}





