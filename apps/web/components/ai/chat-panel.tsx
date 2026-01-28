'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Calculator, Database, Loader2, MapPin, Search, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { buildChatContextBody, useChatContext } from './chat-context-provider';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { StarterPrompts } from './starter-prompts';

// Tool name to user-friendly loading message mapping
const toolLoadingMessages: Record<string, { message: string; icon: React.ElementType }> = {
  searchDistressedParks: { message: 'Searching for distressed parks...', icon: Search },
  getParkDetails: { message: 'Fetching park details...', icon: Database },
  getParkLienHistory: { message: 'Loading tax lien history...', icon: Database },
  analyzeDeal: { message: 'Running financial analysis...', icon: Calculator },
  compareParksByCounty: { message: 'Comparing markets...', icon: TrendingUp },
  getMarketOverview: { message: 'Gathering market insights...', icon: MapPin },
  refreshTdhcaData: { message: 'Initiating data refresh...', icon: Database },
  getDataRefreshStatus: { message: 'Checking refresh status...', icon: Database },
  // Lead-specific tools
  getLeadDetails: { message: 'Fetching lead details...', icon: Database },
  estimateLeadOffer: { message: 'Calculating offer scenarios...', icon: Calculator },
  identifyLeadRedFlags: { message: 'Analyzing risks...', icon: Search },
  compareLeadToNearbyParks: { message: 'Comparing to nearby parks...', icon: TrendingUp },
  suggestLeadFollowUp: { message: 'Generating follow-up checklist...', icon: MapPin },
};

/**
 * Slide-out chat panel component
 *
 * Uses shadcn Sheet for slide-out behavior.
 * Contains the full Deal Scout chat interface with context awareness.
 */
export function ChatPanel() {
  const chatContext = useChatContext();
  const { isOpen, closeChat, currentPark, currentPage } = chatContext;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Use a ref to always have the latest context available during fetch
  const contextRef = useRef(chatContext);
  useEffect(() => {
    contextRef.current = chatContext;
  }, [chatContext]);

  // Custom fetch that injects the current context into the request body
  const customFetch: typeof fetch = async (input, init) => {
    const currentContext = buildChatContextBody(contextRef.current);

    // Parse the original body and add context
    let body: Record<string, unknown> = {};
    if (init?.body && typeof init.body === 'string') {
      body = JSON.parse(init.body);
    }
    body.context = currentContext;

    return fetch(input, {
      ...init,
      body: JSON.stringify(body),
    });
  };

  // Create transport with custom fetch that injects context
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        fetch: customFetch,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- customFetch uses ref, doesn't need to be a dep
    []
  );

  const { messages, status, sendMessage } = useChat({ transport });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      sendMessage({ text: inputValue.trim() });
      setInputValue('');
    }
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  // Get the current active tool from the last message
  const getCurrentTool = (): string | null => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.parts) return null;

    for (const part of lastMessage.parts) {
      if (part.type.startsWith('tool-')) {
        const toolPart = part as unknown as { toolName?: string; state?: string };
        if (toolPart.toolName && (toolPart.state === 'call' || toolPart.state === 'partial-call')) {
          return toolPart.toolName;
        }
      }
    }
    return null;
  };

  const currentTool = getCurrentTool();

  // Extract content and tool invocations from message parts
  const getMessageContent = (message: (typeof messages)[0]) => {
    if (!message.parts) {
      return { content: '', toolInvocations: [] };
    }

    let content = '';
    const toolInvocations: Array<{
      toolCallId: string;
      toolName: string;
      state: 'call' | 'result' | 'partial-call';
      args?: Record<string, unknown>;
      result?: unknown;
    }> = [];

    for (const part of message.parts) {
      if (part.type === 'text') {
        content += part.text;
      } else if (part.type.startsWith('tool-')) {
        const toolPart = part as {
          type: string;
          toolCallId: string;
          toolName: string;
          state?: string;
          input?: unknown;
          output?: unknown;
        };
        toolInvocations.push({
          toolCallId: toolPart.toolCallId,
          toolName: toolPart.toolName,
          state: (toolPart.state as 'call' | 'result' | 'partial-call') || 'call',
          args: toolPart.input as Record<string, unknown>,
          result: toolPart.output,
        });
      }
    }

    return { content, toolInvocations };
  };

  // Build context description for header
  const getContextDescription = () => {
    if (currentPark) {
      return `Viewing: ${currentPark.name} (${currentPark.county})`;
    }
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard overview';
      case 'mh-parks':
        return 'MH Parks explorer';
      case 'deals':
        return 'Your deals';
      default:
        return 'Ready to help';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">Deal Scout</SheetTitle>
          <SheetDescription className="text-xs">{getContextDescription()}</SheetDescription>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-4">
              <StarterPrompts onSelectPrompt={handlePromptSelect} />
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => {
                const { content, toolInvocations } = getMessageContent(message);
                return (
                  <ChatMessage
                    key={message.id}
                    message={{
                      id: message.id,
                      role: message.role as 'user' | 'assistant' | 'system' | 'data',
                      content,
                      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
                    }}
                  />
                );
              })}

              {/* Loading indicator with tool-specific messages */}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 text-muted-foreground">
                  {currentTool && toolLoadingMessages[currentTool] ? (
                    <>
                      {(() => {
                        const IconComponent = toolLoadingMessages[currentTool].icon;
                        return <IconComponent className="h-4 w-4 animate-pulse" />;
                      })()}
                      <span className="text-sm">{toolLoadingMessages[currentTool].message}</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Deal Scout is thinking...</span>
                    </>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder={
            currentPark
              ? `Ask about ${currentPark.name}...`
              : 'Ask about distressed parks, deals, or market trends...'
          }
        />
      </SheetContent>
    </Sheet>
  );
}
