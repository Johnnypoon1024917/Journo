/**
 * Class Name Utility
 * 
 * Utility function for conditionally joining class names.
 * Provides a clean API for combining Tailwind classes with conditional logic.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with conditional logic and Tailwind CSS conflict resolution.
 * 
 * @param inputs - Class names, objects, arrays, or conditional expressions
 * @returns Merged and deduplicated class string
 * 
 * @example
 * cn('px-2 py-1', 'text-sm', { 'bg-blue-500': isActive })
 * cn('px-2', condition && 'py-1', ['text-sm', 'font-medium'])
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}