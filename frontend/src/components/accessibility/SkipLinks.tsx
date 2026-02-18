/**
 * Skip Links Component
 * 
 * Provides keyboard navigation shortcuts to main content areas
 * Essential for screen reader users and keyboard navigation
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
  { id: 'skip-to-search', label: 'Skip to search', targetId: 'search' },
];

export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Navigated to ${target.getAttribute('aria-label') || targetId}`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  return (
    <nav
      aria-label="Skip links"
      className={cn('skip-links', className)}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.targetId}`}
          className={cn(
            'skip-link',
            'sr-only focus:not-sr-only',
            'fixed top-4 left-4 z-[9999]',
            'px-4 py-2 rounded-lg',
            'bg-primary-600 text-white font-medium',
            'focus:outline-none focus:ring-4 focus:ring-primary-300',
            'transition-all duration-200'
          )}
          onClick={(e) => handleSkipClick(e, link.targetId)}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
