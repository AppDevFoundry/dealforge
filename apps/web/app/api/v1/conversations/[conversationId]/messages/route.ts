/**
 * Conversation Messages API
 *
 * GET  - Fetch messages for a conversation with pagination
 * POST - Add a new message to a conversation
 */

import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import { auth } from '@/lib/auth';
import type { MessageRole, ToolInvocation, MessageMetadata } from '@dealforge/types';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

/**
 * Fetch messages for a conversation
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    const sql = getSql();

    // Verify user owns this conversation
    const conversationRows = await sql`
      SELECT user_id
      FROM conversations
      WHERE id = ${conversationId}
      LIMIT 1
    `;

    if (conversationRows.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversationRows[0]!.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages with pagination
    const messages = await sql`
      SELECT *
      FROM conversation_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countRows = await sql`
      SELECT COUNT(*) as total
      FROM conversation_messages
      WHERE conversation_id = ${conversationId}
    `;

    const total = Number(countRows[0]?.total) || 0;
    const hasMore = offset + messages.length < total;

    return Response.json({
      data: {
        messages,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * Add a message to a conversation
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { role, content, toolInvocations, metadata } = body as {
      role: MessageRole;
      content: string;
      toolInvocations?: ToolInvocation[];
      metadata?: MessageMetadata;
    };

    if (!role || !content) {
      return Response.json(
        { error: 'role and content are required' },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Verify user owns this conversation
    const conversationRows = await sql`
      SELECT user_id, message_count
      FROM conversations
      WHERE id = ${conversationId}
      LIMIT 1
    `;

    if (conversationRows.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversationRows[0]!.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert message
    const messageId = `msg_${createId()}`;
    const now = new Date().toISOString();

    const result = await sql`
      INSERT INTO conversation_messages (
        id,
        conversation_id,
        role,
        content,
        tool_invocations,
        metadata,
        created_at
      )
      VALUES (
        ${messageId},
        ${conversationId},
        ${role},
        ${content},
        ${toolInvocations ? JSON.stringify(toolInvocations) : null},
        ${metadata ? JSON.stringify(metadata) : null},
        ${now}
      )
      RETURNING *
    `;

    // Update conversation stats
    const currentMessageCount = Number(conversationRows[0]!.message_count) || 0;
    await sql`
      UPDATE conversations
      SET
        message_count = ${currentMessageCount + 1},
        last_message_at = ${now},
        updated_at = ${now}
      WHERE id = ${conversationId}
    `;

    return Response.json({
      data: result[0],
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return Response.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
