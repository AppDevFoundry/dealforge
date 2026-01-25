'use client';

import { Bot, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useChatContext } from './chat-context-provider';

/**
 * Floating Action Button for opening the chat panel
 *
 * Fixed position in bottom-right corner of viewport.
 * Shows Bot icon when closed, X when open.
 */
export function ChatFAB() {
  const { isOpen, toggleChat } = useChatContext();

  return (
    <Button
      onClick={toggleChat}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg',
        'transition-all duration-200 hover:scale-105 hover:shadow-xl',
        isOpen && 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
      aria-label={isOpen ? 'Close Deal Scout chat' : 'Open Deal Scout chat'}
    >
      {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
    </Button>
  );
}
