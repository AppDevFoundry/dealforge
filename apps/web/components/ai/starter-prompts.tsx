'use client';

import { BarChart3, Calculator, Map as MapIcon, Search, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StarterPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const starterPrompts = [
  {
    icon: Search,
    title: 'Find Distressed Parks',
    description: 'Search by county and distress score',
    prompt: 'Show me the top 10 most distressed parks in Harris County',
  },
  {
    icon: TrendingUp,
    title: 'High Opportunity Search',
    description: 'Find parks with high scores and many lots',
    prompt: 'Find parks with distress scores above 60 and more than 50 lots',
  },
  {
    icon: Calculator,
    title: 'Analyze a Deal',
    description: 'Run financial analysis on an acquisition',
    prompt: 'Analyze a $2M deal for a 75-lot park with 90% occupancy and $450 average rent',
  },
  {
    icon: BarChart3,
    title: 'Compare Markets',
    description: 'Compare distress across counties',
    prompt: 'Compare distressed parks in Dallas, Tarrant, and Bexar counties',
  },
  {
    icon: MapIcon,
    title: 'Market Overview',
    description: 'Get market statistics and trends',
    prompt: "What's the market overview for Travis County?",
  },
];

export function StarterPrompts({ onSelectPrompt }: StarterPromptsProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome to Deal Scout</h2>
        <p className="text-muted-foreground max-w-md">
          I can help you find and analyze distressed mobile home park acquisition opportunities in
          Texas. Try one of these prompts to get started:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {starterPrompts.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              </div>
              <CardDescription className="text-xs">{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic">"{item.prompt}"</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-md text-center">
        Or type your own question below. I have access to park data, tax lien records, and financial
        analysis tools to help you find the best deals.
      </p>
    </div>
  );
}
