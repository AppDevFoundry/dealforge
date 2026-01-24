'use client';

import { Bot } from 'lucide-react';

import { DealScoutChat } from '@/components/ai/deal-scout-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DealScoutPage() {
  return (
    <div className="container py-8 h-[calc(100vh-4rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-none border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Deal Scout</CardTitle>
              <CardDescription>
                AI-powered assistant for finding and analyzing distressed mobile home park
                acquisitions in Texas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <DealScoutChat />
        </CardContent>
      </Card>
    </div>
  );
}
