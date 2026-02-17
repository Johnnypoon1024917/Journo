/**
 * SkipLinks Component
 * 
 * Provides keyboard-accessible skip links to bypass repetitive navigation
 * and jump directly to main content.
 * 
 * Requirements: 9.10 - Skip links for bypassing repetitive navigation
 */

import React from 'react';

export interface SkipLinksProps {
  /** ID of the main content element to skip to */
  mainContentId?: string;
  /** Additional skip link targets */
  additionalLinks?: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  mainContentId = 'main-content',
  additionalLinks = [],
}) => {
  return (
    <>
      <a href={`#${mainContentId}`} className="skip-link">
        Skip to main content
      </a>
      {additionalLinks.map((link, index) => (
        <a key={index} href={link.href} className="skip-link">
          {link.label}
        </a>
      ))}
    </>
  );
};
