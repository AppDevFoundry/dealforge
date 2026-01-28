'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Calculator, Database, Loader2, MapPin, Search, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  // Lead-specific tools
  getLeadDetails: { message: 'Fetching lead details...', icon: Database },
  estimateLeadOffer: { message: 'Calculating offer scenarios...', icon: Calculator },
  identifyLeadRedFlags: { message: 'Analyzing risks...', icon: Search },
  compareLeadToNearbyParks: { message: 'Comparing to nearby parks...', icon: TrendingUp },
  suggestLeadFollowUp: { message: 'Generating follow-up checklist...', icon: MapPin },
};

export function DealScoutChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

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
        // Handle tool invocations
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <StarterPrompts onSelectPrompt={handlePromptSelect} />
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
      />
    </div>
  );
}
