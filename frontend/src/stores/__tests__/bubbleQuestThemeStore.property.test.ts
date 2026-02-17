/**
 * Property-Based Tests for BubbleQuest Theme Store
 * 
 * Tests universal correctness properties using fast-check.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useBubbleQuestThemeStore, type AnimationType } from '../bubbleQuestThemeStore';

describe('BubbleQuest Theme Store - Property Tests', () => {
  // Clear localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property 1: Theme Persistence Round-Trip
   * Feature: bubblequest-ui-redesign
   * Validates: Requirements 1.5, 6.7
   * 
   * For any valid theme configuration (color, font size, dark mode, animations),
   * saving the theme to localStorage and then loading it should restore the exact same configuration.
   */
  it('Property 1: theme round-trip preserves all settings', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryColor: fc.string({ minLength: 6, maxLength: 6 })
            .filter(s => /^[0-9A-Fa-f]{6}$/.test(s))
            .map(s => `#${s.toUpperCase()}`),
          fontSize: fc.integer({ min: 12, max: 24 }),
          darkMode: fc.boolean(),
          animations: fc.constantFrom<AnimationType>('none', 'snow', 'sakura'),
        }),
        (theme) => {
          // Get a fresh store instance
          const store = useBubbleQuestThemeStore.getState();
          
          // Apply theme settings
          store.setPrimaryColor(theme.primaryColor);
          store.setFontSize(theme.fontSize);
          store.setDarkMode(theme.darkMode);
          store.setAnimations(theme.animations);
          
          // Verify settings are applied in store
          expect(store.primaryColor).toBe(theme.primaryColor);
          expect(store.fontSize).toBe(theme.fontSize);
          expect(store.darkMode).toBe(theme.darkMode);
          expect(store.animations).toBe(theme.animations);
          
          // Verify settings are persisted to localStorage
          const saved = localStorage.getItem('bubblequest-theme-settings');
          expect(saved).toBeTruthy();
          
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.state.primaryColor).toBe(theme.primaryColor);
            expect(parsed.state.fontSize).toBe(theme.fontSize);
            expect(parsed.state.darkMode).toBe(theme.darkMode);
            expect(parsed.state.animations).toBe(theme.animations);
          }
          
          // Clear store and reload from localStorage
          localStorage.setItem('bubblequest-theme-settings', JSON.stringify({
            state: theme,
            version: 1,
          }));
          
          // Create a new store instance to simulate page reload
          const newStore = useBubbleQuestThemeStore.getState();
          newStore.loadTheme();
          
          // Verify all settings are restored correctly
          expect(newStore.primaryColor).toBe(theme.primaryColor);
          expect(newStore.fontSize).toBe(theme.fontSize);
          expect(newStore.darkMode).toBe(theme.darkMode);
          expect(newStore.animations).toBe(theme.animations);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 1.1: Font Size Clamping
   * 
   * For any font size value, the store should clamp it to the valid range (12-24px).
   */
  it('Property 1.1: font size is always clamped to valid range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 200 }),
        (size) => {
          const store = useBubbleQuestThemeStore.getState();
          store.setFontSize(size);
          
          // Font size should be clamped to 12-24 range
          expect(store.fontSize).toBeGreaterThanOrEqual(12);
          expect(store.fontSize).toBeLessThanOrEqual(24);
          
          // Verify the clamped value is persisted
          const saved = localStorage.getItem('bubblequest-theme-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.state.fontSize).toBeGreaterThanOrEqual(12);
            expect(parsed.state.fontSize).toBeLessThanOrEqual(24);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 1.2: Primary Color Format
   * 
   * For any primary color set, it should be stored as a valid hex color string.
   */
  it('Property 1.2: primary color is stored in valid hex format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 6 })
          .filter(s => /^[0-9A-Fa-f]{6}$/.test(s))
          .map(s => `#${s}`),
        (color) => {
          const store = useBubbleQuestThemeStore.getState();
          store.setPrimaryColor(color);
          
          // Verify color format
          expect(store.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          
          // Verify persisted color format
          const saved = localStorage.getItem('bubblequest-theme-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.state.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 1.3: Animation Type Validity
   * 
   * For any animation type set, it should be one of the valid options.
   */
  it('Property 1.3: animation type is always valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AnimationType>('none', 'snow', 'sakura'),
        (animationType) => {
          const store = useBubbleQuestThemeStore.getState();
          store.setAnimations(animationType);
          
          // Verify animation type is valid
          expect(['none', 'snow', 'sakura']).toContain(store.animations);
          
          // Verify persisted animation type is valid
          const saved = localStorage.getItem('bubblequest-theme-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(['none', 'snow', 'sakura']).toContain(parsed.state.animations);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 1.4: Theme Reset
   * 
   * After any sequence of theme changes, resetting should restore default values.
   */
  it('Property 1.4: reset theme restores default values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            primaryColor: fc.string({ minLength: 6, maxLength: 6 })
              .filter(s => /^[0-9A-Fa-f]{6}$/.test(s))
              .map(s => `#${s}`),
            fontSize: fc.integer({ min: 12, max: 24 }),
            darkMode: fc.boolean(),
            animations: fc.constantFrom<AnimationType>('none', 'snow', 'sakura'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (themeChanges) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Apply multiple theme changes
          themeChanges.forEach(theme => {
            store.setPrimaryColor(theme.primaryColor);
            store.setFontSize(theme.fontSize);
            store.setDarkMode(theme.darkMode);
            store.setAnimations(theme.animations);
          });
          
          // Reset theme
          store.resetTheme();
          
          // Verify default values are restored
          expect(store.primaryColor).toBe('#FFB3BA');
          expect(store.fontSize).toBe(16);
          expect(store.darkMode).toBe(false);
          expect(store.animations).toBe('none');
        }
      ),
      { numRuns: 10 }
    );
  });
});
