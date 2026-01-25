'use client';

import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import { UIElementRenderer, type UIElement } from '@/lib/ui-catalog';

import { ToolResultDisplay } from './tool-result-display';

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state: 'call' | 'result' | 'partial-call';
  args?: Record<string, unknown>;
  result?: unknown;
}

interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  toolInvocations?: ToolInvocation[];
  ui?: UIElement[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  onParkClick?: (parkId: string) => void;
}

export function ChatMessage({ message, onParkClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-muted/50' : 'bg-background')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-sm font-medium">{isUser ? 'You' : 'Deal Scout'}</p>

        {/* Message content with markdown rendering */}
        {message.content && (
          <div className="text-sm space-y-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse border border-border text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">{children}</td>
                ),
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
                ),
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">{children}</pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Dynamic UI components */}
        {message.ui && message.ui.length > 0 && (
          <UIElementRenderer
            elements={message.ui}
            onParkClick={onParkClick}
            className="space-y-4 mt-4"
          />
        )}

        {/* Tool invocations */}
        {message.toolInvocations?.map((toolInvocation, idx) => (
          <div key={toolInvocation.toolCallId || idx}>
            {toolInvocation.state === 'result' && (
              <ToolResultDisplay
                toolName={toolInvocation.toolName}
                result={toolInvocation.result}
              />
            )}
            {toolInvocation.state === 'call' && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Running {toolInvocation.toolName}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
