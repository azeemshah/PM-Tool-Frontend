import { useContext } from 'react';
import { ScrumboardAppContext, ScrumboardAppContextType } from './ScrumboardAppContext';

export function useScrumboardAppContext(): ScrumboardAppContextType {
  const context = useContext(ScrumboardAppContext);

  if (!context) {
    throw new Error(
      'useScrumboardAppContext must be used within ScrumboardAppContextProvider'
    );
  }

  return context;
}
