/**
 * Breadcrumbs Component
 * 
 * Navigation breadcrumbs for deep routes
 * Provides context and quick navigation to parent pages
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumbs({
  items,
  className,
  separator,
}: BreadcrumbsProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  if (breadcrumbItems.length === 0) return null;

  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-neutral-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.path} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}

              {isLast ? (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    'font-medium text-neutral-900 dark:text-neutral-100',
                    'cursor-default'
                  )}
                  aria-current="page"
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5',
                    'text-neutral-600 dark:text-neutral-400',
                    'hover:text-neutral-900 dark:hover:text-neutral-100',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 rounded',
                    'transition-colors duration-200'
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from URL path
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Capitalize and format segment
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Skip numeric IDs in breadcrumb labels
    if (!/^\d+$/.test(segment)) {
      breadcrumbs.push({
        label,
        path: currentPath,
      });
    }
  });

  return breadcrumbs;
}
