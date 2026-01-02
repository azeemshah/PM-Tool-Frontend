import { ReactNode, useState } from 'react';
import { ScrumboardAppContext, ScrumboardAppContextType } from './ScrumboardAppContext';
import { ScrumboardBoard, ScrumboardCard } from '@/api/scrumboard/types';

interface ScrumboardAppContextProviderProps {
  children: ReactNode;
}

export function ScrumboardAppContextProvider({
  children,
}: ScrumboardAppContextProviderProps) {
  const [selectedBoard, setSelectedBoard] = useState<ScrumboardBoard | null>(null);
  const [selectedCard, setSelectedCard] = useState<ScrumboardCard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');

  const value: ScrumboardAppContextType = {
    selectedBoard,
    setSelectedBoard,
    selectedCard,
    setSelectedCard,
    isCardDialogOpen,
    setIsCardDialogOpen,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    viewMode,
    setViewMode,
  };

  return (
    <ScrumboardAppContext.Provider value={value}>
      {children}
    </ScrumboardAppContext.Provider>
  );
}
