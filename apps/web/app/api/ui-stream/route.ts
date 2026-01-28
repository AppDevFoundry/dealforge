/**
 * UI Streaming API Endpoint
 *
 * Generates UI components via Claude and streams them as JSONL patches
 * for progressive rendering with json-render.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateCatalogPrompt } from '@json-render/core';
import { streamText } from 'ai';

import { uiCatalog } from '@/lib/ui-catalog/json-render-catalog';

export const runtime = 'edge';

/**
 * Generate system prompt with catalog context
 */
function getSystemPrompt(): string {
  const catalogPrompt = generateCatalogPrompt(uiCatalog);

  return `You are a UI generation assistant for DealForge, a real estate investment analysis platform focused on mobile home parks.

${catalogPrompt}

## Output Format

You MUST output valid JSONL (JSON Lines) where each line is a patch operation to build the UI tree progressively.

### Patch Operations

Each line must be a JSON object with one of these operations:

1. **set** - Set a value at a path (creates intermediate objects if needed)
   {"op": "set", "path": "/elements/stat1", "value": {"key": "stat1", "type": "Stat", "props": {...}}}

2. **add** - Append to an array
   {"op": "add", "path": "/elements/container1/children", "value": "stat1"}

3. **replace** - Replace an existing value
   {"op": "replace", "path": "/elements/stat1/props/value", "value": 150000}

4. **remove** - Remove a value
   {"op": "remove", "path": "/elements/stat1"}

### UI Tree Structure

Build a flat element map under /elements with each element having:
- key: unique identifier
- type: component type from catalog
- props: component props
- children: array of child keys (for containers)
- parentKey: parent element key (null for root)

Set the root element key at /root.

### Example Output

For "Show cap rate of 8.5%":

{"op": "set", "path": "/root", "value": "stat1"}
{"op": "set", "path": "/elements/stat1", "value": {"key": "stat1", "type": "Stat", "props": {"label": "Cap Rate", "value": 8.5, "unit": "%", "icon": "percent"}}}

For multiple stats:

{"op": "set", "path": "/root", "value": "container1"}
{"op": "set", "path": "/elements/container1", "value": {"key": "container1", "type": "Container", "props": {"layout": "horizontal", "gap": 4}, "children": []}}
{"op": "set", "path": "/elements/stat1", "value": {"key": "stat1", "type": "Stat", "props": {"label": "Cap Rate", "value": 8.5, "unit": "%"}, "parentKey": "container1"}}
{"op": "add", "path": "/elements/container1/children", "value": "stat1"}
{"op": "set", "path": "/elements/stat2", "value": {"key": "stat2", "type": "Stat", "props": {"label": "NOI", "value": 125000, "unit": "$"}, "parentKey": "container1"}}
{"op": "add", "path": "/elements/container1/children", "value": "stat2"}

## Guidelines

1. Start with the root element
2. Build progressively - users see UI appear as you generate
3. Use appropriate components for the data type
4. Include action buttons when relevant (save_analysis, export_pdf, add_to_watchlist)
5. Group related elements in Containers
6. Use meaningful keys (e.g., "capRateStat", "marketChart")

Output ONLY valid JSONL. No explanations, markdown, or other text.`;
}

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response('Missing prompt', { status: 400 });
    }

    // Build the user message with optional context
    let userMessage = prompt;
    if (context && typeof context === 'object') {
      userMessage = `Context:\n${JSON.stringify(context, null, 2)}\n\nRequest: ${prompt}`;
    }

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    });

    // Return the text stream directly - json-render parses JSONL
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('UI stream error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
