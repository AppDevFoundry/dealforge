/**
 * Conversations API
 *
 * GET  - List conversations for current user (filterable by entityType)
 * POST - Create or get active conversation for an entity
 */

import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import { auth } from '@/lib/auth';
import type { ConversationEntityType } from '@dealforge/types';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

/**
 * List conversations for current user
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as ConversationEntityType | null;

    const sql = getSql();

    let conversations;
    if (entityType) {
      conversations = await sql`
        SELECT *
        FROM conversations
        WHERE user_id = ${session.user.id}
          AND entity_type = ${entityType}
        ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        LIMIT 100
      `;
    } else {
      conversations = await sql`
        SELECT *
        FROM conversations
        WHERE user_id = ${session.user.id}
        ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        LIMIT 100
      `;
    }

    return Response.json({
      data: {
        conversations,
        total: conversations.length,
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return Response.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * Create or get active conversation for an entity
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, title } = body as {
      entityType: ConversationEntityType;
      entityId: string;
      title?: string | null;
    };

    if (!entityType || !entityId) {
      return Response.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Check for existing active conversation
    const existing = await sql`
      SELECT *
      FROM conversations
      WHERE user_id = ${session.user.id}
        AND entity_type = ${entityType}
        AND entity_id = ${entityId}
        AND status = 'active'
      LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json({
        data: existing[0],
        existing: true,
      });
    }

    // Create new conversation
    const conversationId = `conv_${createId()}`;
    const now = new Date().toISOString();

    const result = await sql`
      INSERT INTO conversations (
        id,
        entity_type,
        entity_id,
        user_id,
        title,
        status,
        message_count,
        created_at,
        updated_at
      )
      VALUES (
        ${conversationId},
        ${entityType},
        ${entityId},
        ${session.user.id},
        ${title || null},
        'active',
        0,
        ${now},
        ${now}
      )
      RETURNING *
    `;

    return Response.json({
      data: result[0],
      existing: false,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return Response.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
