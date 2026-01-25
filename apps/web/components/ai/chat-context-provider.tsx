'use client';

import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

/**
 * Park context data for context-aware chat
 */
export interface ParkContext {
  id: string;
  name: string;
  county: string;
  lotCount: number | null;
  distressScore: number | null;
}

/**
 * Chat context state and actions
 */
interface ChatContextState {
  /** Whether the chat panel is open */
  isOpen: boolean;
  /** Current page identifier (e.g., 'dashboard', 'park-detail', 'mh-parks') */
  currentPage: string;
  /** Park context when viewing a specific park */
  currentPark: ParkContext | null;
  /** Open the chat panel */
  openChat: () => void;
  /** Close the chat panel */
  closeChat: () => void;
  /** Toggle the chat panel */
  toggleChat: () => void;
  /** Set the current page context */
  setCurrentPage: (page: string) => void;
  /** Set the current park context */
  setCurrentPark: (park: ParkContext | null) => void;
}

const ChatContext = createContext<ChatContextState | null>(null);

interface ChatContextProviderProps {
  children: ReactNode;
}

/**
 * Provider for chat context state management
 *
 * Manages chat panel visibility and page/park context
 * for context-aware AI interactions.
 */
export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentPark, setCurrentPark] = useState<ParkContext | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const value: ChatContextState = {
    isOpen,
    currentPage,
    currentPark,
    openChat,
    closeChat,
    toggleChat,
    setCurrentPage,
    setCurrentPark,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to access chat context
 *
 * Must be used within a ChatContextProvider
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}

/**
 * Build context object for API request body
 *
 * Returns a serializable context object that can be sent to the chat API
 */
export function buildChatContextBody(state: ChatContextState) {
  return {
    page: state.currentPage,
    park: state.currentPark
      ? {
          id: state.currentPark.id,
          name: state.currentPark.name,
          county: state.currentPark.county,
          lotCount: state.currentPark.lotCount,
          distressScore: state.currentPark.distressScore,
        }
      : null,
  };
}
