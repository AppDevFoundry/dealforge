import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

/**
 * Entity type enum for conversations
 * Supports multiple entity types for generic conversation architecture
 */
export const conversationEntityTypeEnum = pgEnum('conversation_entity_type', [
  'lead',
  'park',
  'deal',
  'tax_lien',
]);

/**
 * Conversation status enum
 */
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'archived']);

/**
 * Message role enum
 */
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);

/**
 * Conversations table
 *
 * Generic conversation storage that works for any entity type.
 * Enables AI chat history for leads, deals, parks, tax liens, etc.
 */
export const conversations = pgTable(
  'conversations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `conv_${createId()}`),

    // Entity relationship (polymorphic)
    entityType: conversationEntityTypeEnum('entity_type').notNull(),
    entityId: text('entity_id').notNull(), // Foreign key to the related entity

    // User relationship
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Conversation metadata
    title: text('title'), // Auto-generated or user-provided
    status: conversationStatusEnum('status').notNull().default('active'),

    // Quick stats (denormalized for performance)
    messageCount: integer('message_count').notNull().default(0),

    // Timestamps
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('conversations_user_id_idx').on(table.userId),
    index('conversations_entity_type_idx').on(table.entityType),
    index('conversations_entity_id_idx').on(table.entityId),
    index('conversations_last_message_at_idx').on(table.lastMessageAt),
    // Composite index for efficient entity + status queries
    index('conversations_entity_type_entity_id_idx').on(table.entityType, table.entityId),
    // Ensure only one active conversation per entity per user
    unique('conversations_unique_active').on(
      table.entityType,
      table.entityId,
      table.userId,
      table.status
    ),
  ]
);

/**
 * Conversation Messages table
 *
 * Stores individual messages in conversations.
 * Each message belongs to a conversation and has a role (user, assistant, system).
 */
export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `msg_${createId()}`),

    // Conversation relationship
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    // Message content
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),

    // Tool invocations (stored as JSONB array)
    // Structure: [{ toolCallId, toolName, args, result, executionTimeMs, error }]
    toolInvocations: jsonb('tool_invocations'),

    // Message metadata (JSONB)
    // Structure: { model, tokensUsed, generationTimeMs, contextSnapshot }
    metadata: jsonb('metadata'),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('conversation_messages_conversation_id_idx').on(table.conversationId),
    index('conversation_messages_created_at_idx').on(table.createdAt),
    // Composite index for efficient conversation + time queries
    index('conversation_messages_conversation_id_created_at_idx').on(
      table.conversationId,
      table.createdAt
    ),
  ]
);

// Type exports
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
