'use client';

/**
 * Streaming UI Demo Page
 *
 * Test page for the json-render streaming UI generation.
 */

import { StreamingUIDemo } from '@/lib/ui-catalog';

export default function StreamingUIDemoPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Streaming UI Demo</h1>
          <p className="text-muted-foreground mt-1">
            Test AI-generated UI components with progressive rendering.
          </p>
        </div>

        <div className="border rounded-lg bg-card">
          <StreamingUIDemo />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Example Prompts</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>
              Show a market snapshot for Bexar County with FMR of $1,200 and unemployment 4.5%
            </li>
            <li>Create a deal summary for Sunset MHP with 8.5% cap rate, recommendation: buy</li>
            <li>Display stats: Cap Rate 8.5%, NOI $125,000, Price/Lot $45,000</li>
            <li>Show a comparison of Harris vs Bexar county markets</li>
            <li>
              Create a park card for "Oak Grove MHP" in Dallas County with 45 lots and distress
              score 72
            </li>
            <li>Show a bar chart of lot counts: Dallas 150, Harris 200, Bexar 180, Travis 120</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
