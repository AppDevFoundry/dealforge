'use client';

import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

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
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
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
          <div className="prose prose-sm dark:prose-invert max-w-none prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-pre:bg-muted prose-pre:rounded-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
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
