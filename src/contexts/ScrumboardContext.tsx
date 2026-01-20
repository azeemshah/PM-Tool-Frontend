import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Sprint, SprintWithWorkItems } from '../api/scrumboard/types';

interface ScrumboardState {
  activeSprintId: string | null;
  sprints: Sprint[];
  selectedWorkItems: string[];
  isDragging: boolean;
}

type ScrumboardAction =
  | { type: 'SET_ACTIVE_SPRINT'; payload: string | null }
  | { type: 'SET_SPRINTS'; payload: Sprint[] }
  | { type: 'ADD_SPRINT'; payload: Sprint }
  | { type: 'UPDATE_SPRINT'; payload: Sprint }
  | { type: 'SELECT_WORK_ITEMS'; payload: string[] }
  | { type: 'SET_DRAGGING'; payload: boolean };

const initialState: ScrumboardState = {
  activeSprintId: null,
  sprints: [],
  selectedWorkItems: [],
  isDragging: false,
};

function scrumboardReducer(state: ScrumboardState, action: ScrumboardAction): ScrumboardState {
  switch (action.type) {
    case 'SET_ACTIVE_SPRINT':
      return { ...state, activeSprintId: action.payload };
    case 'SET_SPRINTS':
      return { ...state, sprints: action.payload };
    case 'ADD_SPRINT':
      return { ...state, sprints: [...state.sprints, action.payload] };
    case 'UPDATE_SPRINT':
      return {
        ...state,
        sprints: state.sprints.map(sprint =>
          sprint._id === action.payload._id ? action.payload : sprint
        ),
      };
    case 'SELECT_WORK_ITEMS':
      return { ...state, selectedWorkItems: action.payload };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    default:
      return state;
  }
}

interface ScrumboardContextType {
  state: ScrumboardState;
  dispatch: React.Dispatch<ScrumboardAction>;
  setActiveSprint: (sprintId: string | null) => void;
  selectWorkItems: (workItemIds: string[]) => void;
  setDragging: (isDragging: boolean) => void;
}

const ScrumboardContext = createContext<ScrumboardContextType | undefined>(undefined);

export const useScrumboard = () => {
  const context = useContext(ScrumboardContext);
  if (!context) {
    throw new Error('useScrumboard must be used within a ScrumboardProvider');
  }
  return context;
};

interface ScrumboardProviderProps {
  children: ReactNode;
}

export const ScrumboardProvider: React.FC<ScrumboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(scrumboardReducer, initialState);

  const setActiveSprint = (sprintId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SPRINT', payload: sprintId });
  };

  const selectWorkItems = (workItemIds: string[]) => {
    dispatch({ type: 'SELECT_WORK_ITEMS', payload: workItemIds });
  };

  const setDragging = (isDragging: boolean) => {
    dispatch({ type: 'SET_DRAGGING', payload: isDragging });
  };

  const value: ScrumboardContextType = {
    state,
    dispatch,
    setActiveSprint,
    selectWorkItems,
    setDragging,
  };

  return (
    <ScrumboardContext.Provider value={value}>
      {children}
    </ScrumboardContext.Provider>
  );
};