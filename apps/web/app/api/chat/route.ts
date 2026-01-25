/**
 * Chat API Route
 *
 * Handles streaming chat requests for the Deal Scout AI agent.
 * Uses Vercel AI SDK with Anthropic Claude and custom tools.
 */

import { convertToModelMessages, stepCountIs, streamText } from 'ai';

import {
  type ChatContext,
  DEAL_SCOUT_SYSTEM_PROMPT,
  buildContextAwarePrompt,
  dealScoutModel,
} from '@/lib/ai/config';
import { dealScoutTools } from '@/lib/ai/tools';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { messages, context } = (await request.json()) as {
      messages: unknown;
      context?: ChatContext;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages);

    // Build context-aware system prompt
    const systemPrompt = buildContextAwarePrompt(DEAL_SCOUT_SYSTEM_PROMPT, context);

    const result = streamText({
      model: dealScoutModel,
      system: systemPrompt,
      messages: modelMessages,
      tools: dealScoutTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
