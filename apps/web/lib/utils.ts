import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 *
 * This utility combines clsx for conditional class names with
 * tailwind-merge to properly handle Tailwind class conflicts.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-2')
 * // Result: 'py-2 bg-primary px-2' (px-4 is overridden by px-2)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
