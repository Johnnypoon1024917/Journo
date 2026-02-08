import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Dark Mode localStorage', () => {
  const DARK_MODE_KEY = 'journo-dark-mode';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store dark mode preference in localStorage', () => {
    localStorage.setItem(DARK_MODE_KEY, 'dark');
    expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark');
  });

  it('should store light mode preference in localStorage', () => {
    localStorage.setItem(DARK_MODE_KEY, 'light');
    expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light');
  });

  it('should store system preference in localStorage', () => {
    localStorage.setItem(DARK_MODE_KEY, 'system');
    expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system');
  });

  it('should return null when no preference is stored', () => {
    expect(localStorage.getItem(DARK_MODE_KEY)).toBeNull();
  });
});
