/**
 * Contrast Checker Utility
 * 
 * Validates and adjusts color combinations for WCAG compliance
 * Ensures 4.5:1 contrast ratio for normal text, 3:1 for large text
 */

import { hexToRgb, getContrastRatio } from './accessibility';

export interface ColorAdjustment {
  original: string;
  adjusted: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function checkContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { ratio: number; meetsAA: boolean; meetsAAA: boolean } {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return { ratio: 0, meetsAA: false, meetsAAA: false };
  }

  const ratio = getContrastRatio(fg, bg);
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;

  return {
    ratio,
    meetsAA: ratio >= aaThreshold,
    meetsAAA: ratio >= aaaThreshold,
  };
}

/**
 * Adjust text color to meet WCAG AA standards
 */
export function adjustTextColor(
  textColor: string,
  backgroundColor: string,
  isLargeText: boolean = false,
  isDarkMode: boolean = false
): ColorAdjustment {
  const check = checkContrast(textColor, backgroundColor, isLargeText);

  if (check.meetsAA) {
    return {
      original: textColor,
      adjusted: textColor,
      ratio: check.ratio,
      meetsAA: true,
      meetsAAA: check.meetsAAA,
    };
  }

  // Adjust color to meet standards
  const adjusted = isDarkMode
    ? lightenColor(textColor, check.ratio, backgroundColor, isLargeText)
    : darkenColor(textColor, check.ratio, backgroundColor, isLargeText);

  const newCheck = checkContrast(adjusted, backgroundColor, isLargeText);

  return {
    original: textColor,
    adjusted,
    ratio: newCheck.ratio,
    meetsAA: newCheck.meetsAA,
    meetsAAA: newCheck.meetsAAA,
  };
}

/**
 * Darken a color until it meets contrast requirements
 */
function darkenColor(
  color: string,
  currentRatio: number,
  background: string,
  isLargeText: boolean
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const targetRatio = isLargeText ? 3 : 4.5;
  let { r, g, b } = rgb;

  // Iteratively darken until we meet the target
  for (let i = 0; i < 100; i++) {
    r = Math.max(0, r - 2);
    g = Math.max(0, g - 2);
    b = Math.max(0, b - 2);

    const newColor = rgbToHex(r, g, b);
    const check = checkContrast(newColor, background, isLargeText);

    if (check.meetsAA) {
      return newColor;
    }

    // If we've reached black, return it
    if (r === 0 && g === 0 && b === 0) {
      return '#000000';
    }
  }

  return rgbToHex(r, g, b);
}

/**
 * Lighten a color until it meets contrast requirements
 */
function lightenColor(
  color: string,
  currentRatio: number,
  background: string,
  isLargeText: boolean
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const targetRatio = isLargeText ? 3 : 4.5;
  let { r, g, b } = rgb;

  // Iteratively lighten until we meet the target
  for (let i = 0; i < 100; i++) {
    r = Math.min(255, r + 2);
    g = Math.min(255, g + 2);
    b = Math.min(255, b + 2);

    const newColor = rgbToHex(r, g, b);
    const check = checkContrast(newColor, background, isLargeText);

    if (check.meetsAA) {
      return newColor;
    }

    // If we've reached white, return it
    if (r === 255 && g === 255 && b === 255) {
      return '#FFFFFF';
    }
  }

  return rgbToHex(r, g, b);
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Get accessible text color for a background
 */
export function getAccessibleTextColor(
  backgroundColor: string,
  isLargeText: boolean = false
): string {
  // Try white first
  const whiteCheck = checkContrast('#FFFFFF', backgroundColor, isLargeText);
  if (whiteCheck.meetsAA) {
    return '#FFFFFF';
  }

  // Try black
  const blackCheck = checkContrast('#000000', backgroundColor, isLargeText);
  if (blackCheck.meetsAA) {
    return '#000000';
  }

  // Use gray-800 for light backgrounds, gray-200 for dark
  const bg = hexToRgb(backgroundColor);
  if (!bg) return '#000000';

  const luminance = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#e2e8f0'; // gray-800 : gray-200
}

/**
 * Auto-adjust color for high contrast mode
 * Increases contrast ratio by darkening or lightening colors
 */
export function adjustForHighContrast(
  color: string,
  isBackground: boolean = false,
  multiplier: number = 1.5
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  let { r, g, b } = rgb;

  if (isBackground) {
    // Lighten backgrounds in high contrast
    r = Math.min(255, Math.round(r + (255 - r) * (multiplier - 1)));
    g = Math.min(255, Math.round(g + (255 - g) * (multiplier - 1)));
    b = Math.min(255, Math.round(b + (255 - b) * (multiplier - 1)));
  } else {
    // Darken text/foreground in high contrast
    r = Math.max(0, Math.round(r / multiplier));
    g = Math.max(0, Math.round(g / multiplier));
    b = Math.max(0, Math.round(b / multiplier));
  }

  return rgbToHex(r, g, b);
}

/**
 * Check if system prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  
  const forcedColors = window.matchMedia('(forced-colors: active)').matches;
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
  
  return forcedColors || prefersContrast;
}
