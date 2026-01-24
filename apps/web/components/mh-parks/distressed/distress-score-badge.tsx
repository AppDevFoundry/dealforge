'use client';

import { Badge } from '@/components/ui/badge';

interface DistressScoreBadgeProps {
  score: number;
}

export function DistressScoreBadge({ score }: DistressScoreBadgeProps) {
  if (score >= 61) {
    return (
      <Badge
        variant="destructive"
        className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      >
        {score}
      </Badge>
    );
  }

  if (score >= 31) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      >
        {score}
      </Badge>
    );
  }

  return (
    <Badge
      variant="default"
      className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    >
      {score}
    </Badge>
  );
}
