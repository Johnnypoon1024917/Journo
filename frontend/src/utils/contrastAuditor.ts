/**
 * Contrast Auditor
 * 
 * Development tool to audit and report contrast issues in the application
 * Helps identify WCAG violations during development
 */

import { checkContrast } from './contrastChecker';

export interface ContrastIssue {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  severity: 'fail-aa' | 'fail-aaa' | 'pass-aa' | 'pass-aaa';
  location?: string;
}

/**
 * Audit contrast ratios for all text elements on the page
 */
export function auditPageContrast(): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  // Get all text-containing elements
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    
    // Skip non-visible elements
    if (htmlElement.offsetParent === null) return;
    
    // Get computed styles
    const styles = window.getComputedStyle(htmlElement);
    const color = styles.color;
    const backgroundColor = getEffectiveBackgroundColor(htmlElement);
    
    if (!color || !backgroundColor) return;

    // Check if element contains text
    const hasText = htmlElement.textContent?.trim().length ?? 0 > 0;
    if (!hasText) return;

    // Determine if text is large (18pt+ or 14pt+ bold)
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight) || 400;
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

    // Check contrast
    const result = checkContrast(color, backgroundColor, isLargeText);
    
    // Record issues
    if (!result.meetsAA) {
      issues.push({
        element: getElementSelector(htmlElement),
        foreground: color,
        background: backgroundColor,
        ratio: result.ratio,
        required: isLargeText ? 3 : 4.5,
        severity: 'fail-aa',
        location: getElementLocation(htmlElement),
      });
    } else if (!result.meetsAAA) {
      issues.push({
        element: getElementSelector(htmlElement),
        foreground: color,
        background: backgroundColor,
        ratio: result.ratio,
        required: isLargeText ? 4.5 : 7,
        severity: 'fail-aaa',
        location: getElementLocation(htmlElement),
      });
    }
  });

  return issues;
}

/**
 * Get effective background color by traversing up the DOM tree
 */
function getEffectiveBackgroundColor(element: HTMLElement): string | null {
  let current: HTMLElement | null = element;
  
  while (current) {
    const styles = window.getComputedStyle(current);
    const bgColor = styles.backgroundColor;
    
    // Check if background is not transparent
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      return rgbToHex(bgColor);
    }
    
    current = current.parentElement;
  }
  
  // Default to white if no background found
  return '#ffffff';
}

/**
 * Convert RGB/RGBA string to hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g);
  if (!match) return '#000000';
  
  const [r, g, b] = match.map(Number);
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Get a CSS selector for an element
 */
function getElementSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = Array.from(element.classList).slice(0, 2).join('.');
    return `${element.tagName.toLowerCase()}.${classes}`;
  }
  
  return element.tagName.toLowerCase();
}

/**
 * Get element location in the page
 */
function getElementLocation(element: HTMLElement): string {
  const rect = element.getBoundingClientRect();
  return `x: ${Math.round(rect.left)}, y: ${Math.round(rect.top)}`;
}

/**
 * Log contrast issues to console (development only)
 */
export function logContrastIssues(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const issues = auditPageContrast();
  
  if (issues.length === 0) {
    console.log('%c✓ No contrast issues found!', 'color: green; font-weight: bold;');
    return;
  }

  console.group(`%c⚠ Found ${issues.length} contrast issues`, 'color: orange; font-weight: bold;');
  
  const aaFailures = issues.filter(i => i.severity === 'fail-aa');
  const aaaFailures = issues.filter(i => i.severity === 'fail-aaa');
  
  if (aaFailures.length > 0) {
    console.group(`%c✕ ${aaFailures.length} WCAG AA failures (critical)`, 'color: red; font-weight: bold;');
    aaFailures.forEach(issue => {
      console.log(
        `${issue.element}\n` +
        `  Ratio: ${issue.ratio.toFixed(2)}:1 (required: ${issue.required}:1)\n` +
        `  Colors: ${issue.foreground} on ${issue.background}\n` +
        `  Location: ${issue.location}`
      );
    });
    console.groupEnd();
  }
  
  if (aaaFailures.length > 0) {
    console.group(`%c⚠ ${aaaFailures.length} WCAG AAA failures (recommended)`, 'color: orange;');
    aaaFailures.forEach(issue => {
      console.log(
        `${issue.element}\n` +
        `  Ratio: ${issue.ratio.toFixed(2)}:1 (required: ${issue.required}:1)\n` +
        `  Colors: ${issue.foreground} on ${issue.background}`
      );
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Create a visual overlay showing contrast issues (development only)
 */
export function highlightContrastIssues(): void {
  if (process.env.NODE_ENV !== 'development') return;

  // Remove existing overlays
  document.querySelectorAll('.contrast-issue-overlay').forEach(el => el.remove());

  const issues = auditPageContrast();
  const aaFailures = issues.filter(i => i.severity === 'fail-aa');

  aaFailures.forEach(issue => {
    const elements = document.querySelectorAll(issue.element);
    elements.forEach(element => {
      const overlay = document.createElement('div');
      overlay.className = 'contrast-issue-overlay';
      overlay.style.cssText = `
        position: absolute;
        border: 2px solid red;
        pointer-events: none;
        z-index: 10000;
        background: rgba(255, 0, 0, 0.1);
      `;
      
      const rect = element.getBoundingClientRect();
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      
      document.body.appendChild(overlay);
    });
  });
}
