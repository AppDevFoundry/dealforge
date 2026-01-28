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
 * Lead context data for context-aware chat
 */
export interface LeadContext {
  id: string;
  address: string;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  propertyType?: string | null;
  propertyCondition?: string | null;
  status: string;
  askingPrice?: number | null;
  estimatedValue?: number | null;
  lotRent?: number | null;
  hasIntelligence: boolean;
  intelligenceHighlights?: {
    hasUtilities: boolean;
    floodRisk: string;
    nearbyParksCount: number;
    aiRecommendation: string;
  };
}

/**
 * Chat context state and actions
 */
interface ChatContextState {
  /** Whether the chat panel is open */
  isOpen: boolean;
  /** Current page identifier (e.g., 'dashboard', 'park-detail', 'mh-parks', 'lead-detail') */
  currentPage: string;
  /** Park context when viewing a specific park */
  currentPark: ParkContext | null;
  /** Lead context when viewing a specific lead */
  currentLead: LeadContext | null;
  /** Current conversation ID for persistence */
  conversationId: string | null;
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
  /** Set the current lead context */
  setCurrentLead: (lead: LeadContext | null) => void;
  /** Set the current conversation ID */
  setConversationId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextState | null>(null);

interface ChatContextProviderProps {
  children: ReactNode;
}

/**
 * Provider for chat context state management
 *
 * Manages chat panel visibility, page/park/lead context,
 * and conversation persistence for context-aware AI interactions.
 */
export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentPark, setCurrentPark] = useState<ParkContext | null>(null);
  const [currentLead, setCurrentLead] = useState<LeadContext | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const value: ChatContextState = {
    isOpen,
    currentPage,
    currentPark,
    currentLead,
    conversationId,
    openChat,
    closeChat,
    toggleChat,
    setCurrentPage,
    setCurrentPark,
    setCurrentLead,
    setConversationId,
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
    lead: state.currentLead
      ? {
          id: state.currentLead.id,
          address: state.currentLead.address,
          city: state.currentLead.city,
          county: state.currentLead.county,
          state: state.currentLead.state,
          propertyType: state.currentLead.propertyType,
          propertyCondition: state.currentLead.propertyCondition,
          status: state.currentLead.status,
          askingPrice: state.currentLead.askingPrice,
          estimatedValue: state.currentLead.estimatedValue,
          lotRent: state.currentLead.lotRent,
          hasIntelligence: state.currentLead.hasIntelligence,
          intelligenceHighlights: state.currentLead.intelligenceHighlights,
        }
      : null,
  };
}
