/**
 * Conversation types for AI chat persistence
 *
 * Generic conversation architecture that supports multiple entity types
 * (leads, deals, parks, tax liens, etc.)
 */

/**
 * Supported entity types for conversations
 */
export type ConversationEntityType = 'lead' | 'park' | 'deal' | 'tax_lien';

/**
 * Conversation status
 */
export type ConversationStatus = 'active' | 'archived';

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Conversation record
 */
export interface Conversation {
  id: string;
  entityType: ConversationEntityType;
  entityId: string;
  userId: string;
  title: string | null;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Tool invocation record
 * Stores information about AI tool calls and their results
 */
export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  executionTimeMs?: number;
  error?: string;
}

/**
 * Message metadata
 * Additional information about the message generation
 */
export interface MessageMetadata {
  model?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
  generationTimeMs?: number;
  contextSnapshot?: {
    entityType: string;
    entityId: string;
    entityStatus?: string;
    page?: string;
  };
}

/**
 * Conversation message record
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolInvocations?: ToolInvocation[] | null;
  metadata?: MessageMetadata | null;
  createdAt: Date | string;
}

/**
 * Request to create a new conversation
 */
export interface CreateConversationRequest {
  entityType: ConversationEntityType;
  entityId: string;
  title?: string | null;
}

/**
 * Request to create a new message
 */
export interface CreateMessageRequest {
  conversationId: string;
  role: MessageRole;
  content: string;
  toolInvocations?: ToolInvocation[];
  metadata?: MessageMetadata;
}

/**
 * Conversation with messages
 */
export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

/**
 * Conversation list response
 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

/**
 * Messages list response with pagination
 */
export interface MessagesListResponse {
  messages: ConversationMessage[];
  total: number;
  hasMore: boolean;
}

/**
 * Lead context for AI chat
 * Used to inject lead information into the system prompt
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
