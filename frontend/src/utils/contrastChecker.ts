/**
 * Color Contrast Checker Utility
 * Validates WCAG AA and AAA compliance for color combinations
 */

import { getContrastRatio, hexToRgb, meetsWCAGAA, meetsWCAGAAA } from './accessibility';

export interface ColorPair {
  foreground: string;
  background: string;
  location: string;
  element?: string;
}

export interface ContrastResult {
  pair: ColorPair;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  isLargeText: boolean;
  recommendation?: string;
}

/**
 * Check contrast ratio for a color pair
 */
export function checkContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): ContrastResult | null {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return null;
  }
  
  const ratio = getContrastRatio(fg, bg);
  const meetsAA = meetsWCAGAA(foreground, background, isLargeText);
  const meetsAAA = meetsWCAGAAA(foreground, background, isLargeText);
  
  let recommendation: string | undefined;
  if (!meetsAA) {
    const requiredRatio = isLargeText ? 3 : 4.5;
    recommendation = `Increase contrast to at least ${requiredRatio}:1 for WCAG AA compliance`;
  }
  
  return {
    pair: { foreground, background, location: '' },
    ratio: Math.round(ratio * 100) / 100,
    meetsAA,
    meetsAAA,
    isLargeText,
    recommendation,
  };
}

/**
 * Predefined color pairs used in the application
 * These should be audited for WCAG compliance
 */
export const APP_COLOR_PAIRS: ColorPair[] = [
  // Primary text colors
  { foreground: '#1f2937', background: '#ffffff', location: 'Primary text on white', element: '.text-primary' },
  { foreground: '#f9fafb', background: '#111827', location: 'Primary text on dark', element: '.dark .text-primary' },
  
  // Secondary text colors
  { foreground: '#4b5563', background: '#ffffff', location: 'Secondary text on white', element: '.text-secondary' },
  { foreground: '#d1d5db', background: '#111827', location: 'Secondary text on dark', element: '.dark .text-secondary' },
  
  // Muted text colors
  { foreground: '#6b7280', background: '#ffffff', location: 'Muted text on white', element: '.text-muted' },
  { foreground: '#9ca3af', background: '#111827', location: 'Muted text on dark', element: '.dark .text-muted' },
  
  // Link colors
  { foreground: '#1d4ed8', background: '#ffffff', location: 'Links on white', element: 'a, .link' },
  { foreground: '#93c5fd', background: '#111827', location: 'Links on dark', element: '.dark a' },
  
  // Button colors
  { foreground: '#ffffff', background: '#1d4ed8', location: 'Primary button', element: '.btn-primary' },
  { foreground: '#1f2937', background: '#e5e7eb', location: 'Secondary button', element: '.btn-secondary' },
  { foreground: '#f9fafb', background: '#374151', location: 'Secondary button dark', element: '.dark .btn-secondary' },
  { foreground: '#ffffff', background: '#dc2626', location: 'Danger button', element: '.btn-danger' },
  
  // Status colors
  { foreground: '#166534', background: '#dcfce7', location: 'Success status', element: '.status-success' },
  { foreground: '#bbf7d0', background: '#14532d', location: 'Success status dark', element: '.dark .status-success' },
  { foreground: '#92400e', background: '#fef3c7', location: 'Warning status', element: '.status-warning' },
  { foreground: '#fef3c7', background: '#78350f', location: 'Warning status dark', element: '.dark .status-warning' },
  { foreground: '#991b1b', background: '#fee2e2', location: 'Error status', element: '.status-error' },
  { foreground: '#fecaca', background: '#7f1d1d', location: 'Error status dark', element: '.dark .status-error' },
  { foreground: '#1e40af', background: '#dbeafe', location: 'Info status', element: '.status-info' },
  { foreground: '#dbeafe', background: '#1e3a8a', location: 'Info status dark', element: '.dark .status-info' },
  
  // BubbleQuest theme colors
  { foreground: '#1f2937', background: '#fef3e2', location: 'BubbleQuest cream background', element: '.bubblequest-bg' },
  { foreground: '#ec4899', background: '#ffffff', location: 'BubbleQuest pink accent', element: '.bubblequest-pink' },
  { foreground: '#8b5cf6', background: '#ffffff', location: 'BubbleQuest purple accent', element: '.bubblequest-purple' },
  { foreground: '#3b82f6', background: '#ffffff', location: 'BubbleQuest blue accent', element: '.bubblequest-blue' },
];

/**
 * Audit all predefined color pairs
 */
export function auditColorContrast(): ContrastResult[] {
  const results: ContrastResult[] = [];
  
  for (const pair of APP_COLOR_PAIRS) {
    const result = checkContrast(pair.foreground, pair.background);
    if (result) {
      result.pair = pair;
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Log contrast audit results to console (development only)
 */
export function logContrastAudit(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const results = auditColorContrast();
  const failures = results.filter(r => !r.meetsAA);
  
  console.group(`🎨 Color Contrast Audit (WCAG AA)`);
  console.log(`Total pairs checked: ${results.length}`);
  console.log(`Passing: ${results.length - failures.length}`);
  console.log(`Failing: ${failures.length}`);
  
  if (failures.length > 0) {
    console.group('❌ Failing pairs:');
    failures.forEach(result => {
      console.log(
        `${result.pair.location} (${result.pair.element}): ${result.ratio}:1`,
        result.recommendation
      );
    });
    console.groupEnd();
  }
  
  const aaaFailures = results.filter(r => r.meetsAA && !r.meetsAAA);
  if (aaaFailures.length > 0) {
    console.group('⚠️ Passing AA but not AAA:');
    aaaFailures.forEach(result => {
      console.log(
        `${result.pair.location}: ${result.ratio}:1`
      );
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Get suggested foreground color for a background to meet WCAG AA
 */
export function suggestForegroundColor(
  backgroundColor: string,
  preferDark: boolean = true
): string {
  const bg = hexToRgb(backgroundColor);
  if (!bg) return '#000000';
  
  // Try black first if preferDark
  if (preferDark) {
    if (meetsWCAGAA('#000000', backgroundColor)) {
      return '#000000';
    }
  }
  
  // Try white
  if (meetsWCAGAA('#ffffff', backgroundColor)) {
    return '#ffffff';
  }
  
  // Try black if not preferDark
  if (!preferDark) {
    if (meetsWCAGAA('#000000', backgroundColor)) {
      return '#000000';
    }
  }
  
  // If neither works, return the one with better contrast
  const blackRatio = getContrastRatio(bg, { r: 0, g: 0, b: 0 });
  const whiteRatio = getContrastRatio(bg, { r: 255, g: 255, b: 255 });
  
  return blackRatio > whiteRatio ? '#000000' : '#ffffff';
}

/**
 * Validate contrast for computed styles on an element
 */
export function validateElementContrast(element: HTMLElement): ContrastResult | null {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // Convert RGB to hex
  const rgbToHex = (rgb: string): string | null => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  const fgHex = rgbToHex(color);
  const bgHex = rgbToHex(backgroundColor);
  
  if (!fgHex || !bgHex) return null;
  
  const fontSize = parseFloat(styles.fontSize);
  const fontWeight = styles.fontWeight;
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
  
  return checkContrast(fgHex, bgHex, isLargeText);
}
