/**
 * Property-Based Tests for Dark Mode Toggle
 * 
 * Tests universal correctness properties for dark mode functionality using fast-check.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useBubbleQuestThemeStore } from '../bubbleQuestThemeStore';

describe('BubbleQuest Theme Store - Dark Mode Property Tests', () => {
  // Clear localStorage and reset DOM before and after each test
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  /**
   * Property 2: Dark Mode Toggle
   * Feature: bubblequest-ui-redesign
   * Validates: Requirements 1.6, 6.4
   * 
   * For any theme state, toggling dark mode should update the CSS class on the document root
   * and persist the change to localStorage.
   */
  it('Property 2: dark mode toggle updates DOM and persists', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkModeEnabled) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Set dark mode
          store.setDarkMode(darkModeEnabled);
          
          // Verify store state
          expect(store.darkMode).toBe(darkModeEnabled);
          
          // Verify DOM class is updated
          if (darkModeEnabled) {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }
          
          // Verify persistence to localStorage
          const saved = localStorage.getItem('bubblequest-theme-settings');
          expect(saved).toBeTruthy();
          
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.state.darkMode).toBe(darkModeEnabled);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2.1: Dark Mode Toggle Idempotence
   * 
   * Setting dark mode to the same value multiple times should be idempotent.
   */
  it('Property 2.1: setting dark mode multiple times is idempotent', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 5 }),
        (darkModeEnabled, repeatCount) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Set dark mode multiple times
          for (let i = 0; i < repeatCount; i++) {
            store.setDarkMode(darkModeEnabled);
          }
          
          // Verify final state
          expect(store.darkMode).toBe(darkModeEnabled);
          
          // Verify DOM class
          if (darkModeEnabled) {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2.2: Dark Mode Toggle Sequence
   * 
   * For any sequence of dark mode toggles, the final state should match the last toggle value.
   */
  it('Property 2.2: dark mode sequence ends with last value', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (toggleSequence) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Apply sequence of toggles
          toggleSequence.forEach(enabled => {
            store.setDarkMode(enabled);
          });
          
          // Final state should match last toggle
          const lastToggle = toggleSequence[toggleSequence.length - 1];
          expect(store.darkMode).toBe(lastToggle);
          
          // Verify DOM class matches final state
          if (lastToggle) {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2.3: Dark Mode Persistence After Reload
   * 
   * After setting dark mode and simulating a page reload, the dark mode state should be restored.
   */
  it('Property 2.3: dark mode persists across simulated reloads', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkModeEnabled) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Set dark mode
          store.setDarkMode(darkModeEnabled);
          
          // Simulate page reload by loading theme
          store.loadTheme();
          
          // Verify state is restored
          expect(store.darkMode).toBe(darkModeEnabled);
          
          // Verify DOM class is restored
          if (darkModeEnabled) {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2.4: Dark Mode Independent of Other Settings
   * 
   * Changing dark mode should not affect other theme settings.
   */
  it('Property 2.4: dark mode toggle does not affect other settings', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryColor: fc.constantFrom('#FFB3BA', '#F4A460', '#6B9BD1', '#7ECEC4', '#C5B3E6', '#FFD97D'),
          fontSize: fc.integer({ min: 12, max: 24 }),
          animations: fc.constantFrom('none', 'snow', 'sakura'),
        }),
        fc.boolean(),
        (initialTheme, darkModeEnabled) => {
          const store = useBubbleQuestThemeStore.getState();
          
          // Set initial theme
          store.setPrimaryColor(initialTheme.primaryColor);
          store.setFontSize(initialTheme.fontSize);
          store.setAnimations(initialTheme.animations);
          
          // Toggle dark mode
          store.setDarkMode(darkModeEnabled);
          
          // Verify other settings are unchanged
          expect(store.primaryColor).toBe(initialTheme.primaryColor);
          expect(store.fontSize).toBe(initialTheme.fontSize);
          expect(store.animations).toBe(initialTheme.animations);
          
          // Verify dark mode is set correctly
          expect(store.darkMode).toBe(darkModeEnabled);
        }
      ),
      { numRuns: 10 }
    );
  });
});
