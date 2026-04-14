import { useContext } from 'react';
import { KanbanAppContext, KanbanAppContextType } from './KanbanAppContext';

export function useKanbanAppContext(): KanbanAppContextType {
  const context = useContext(KanbanAppContext);

  if (!context) {
    throw new Error(
      'useKanbanAppContext must be used within KanbanAppContextProvider'
    );
  }

  return context;
}





