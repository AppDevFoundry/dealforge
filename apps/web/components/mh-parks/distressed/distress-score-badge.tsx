'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DistressLevel } from '@dealforge/types';

interface DistressScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Get the distress level from a score (0-100)
 */
export function getDistressLevel(score: number): DistressLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get the label for a distress level
 */
export function getDistressLevelLabel(level: DistressLevel): string {
  switch (level) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

const levelColors: Record<DistressLevel, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1',
};

export function DistressScoreBadge({
  score,
  showLabel = true,
  size = 'md',
  className,
}: DistressScoreBadgeProps) {
  const level = getDistressLevel(score);
  const label = getDistressLevelLabel(level);

  return (
    <Badge
      variant="secondary"
      className={cn('font-semibold border-0', levelColors[level], sizeClasses[size], className)}
    >
      {score.toFixed(0)}
      {showLabel && <span className="ml-1 font-normal">({label})</span>}
    </Badge>
  );
}
