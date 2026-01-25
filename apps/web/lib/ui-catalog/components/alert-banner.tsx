'use client';

import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import type { AlertBannerElement } from '../types';

const variantConfig = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  },
};

interface AlertBannerProps {
  data: Omit<AlertBannerElement, 'id' | 'type'>;
  className?: string;
}

export function AlertBanner({ data, className }: AlertBannerProps) {
  const { variant, title, message } = data;
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
