import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18n from '../config';

describe('i18n Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with English as fallback language', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('should support four languages: en, zh-TW, zh-CN, ja', () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toContain('en');
    expect(languages).toContain('zh-TW');
    expect(languages).toContain('zh-CN');
    expect(languages).toContain('ja');
    expect(languages).toHaveLength(4);
  });

  it('should have all required namespaces', () => {
    const namespaces = i18n.options.ns as string[];
    expect(namespaces).toContain('common');
    expect(namespaces).toContain('trip');
    expect(namespaces).toContain('place');
    expect(namespaces).toContain('budget');
    expect(namespaces).toContain('packing');
    expect(namespaces).toContain('community');
    expect(namespaces).toContain('settings');
    expect(namespaces).toContain('errors');
  });

  it('should use common as default namespace', () => {
    expect(i18n.options.defaultNS).toBe('common');
  });

  it('should have interpolation escapeValue set to false', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });
});

describe('Language Detection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should support Traditional Chinese language', async () => {
    await i18n.changeLanguage('zh-TW');
    expect(i18n.language).toBe('zh-TW');
  });

  it('should support Simplified Chinese language', async () => {
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
  });

  it('should support English language', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should support Japanese language', async () => {
    await i18n.changeLanguage('ja');
    expect(i18n.language).toBe('ja');
  });
});

describe('Language Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should persist language selection to localStorage', async () => {
    await i18n.changeLanguage('zh-TW');
    expect(localStorage.getItem('i18nextLng')).toBe('zh-TW');
  });

  it('should load persisted language from localStorage', async () => {
    localStorage.setItem('i18nextLng', 'zh-CN');
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
  });

  it('should persist language changes across sessions', async () => {
    await i18n.changeLanguage('zh-TW');
    const savedLanguage = localStorage.getItem('i18nextLng');
    expect(savedLanguage).toBe('zh-TW');
    
    // Simulate new session
    await i18n.changeLanguage(savedLanguage!);
    expect(i18n.language).toBe('zh-TW');
  });
});

describe('Language Switching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should switch from English to Traditional Chinese', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    
    await i18n.changeLanguage('zh-TW');
    expect(i18n.language).toBe('zh-TW');
  });

  it('should switch from English to Simplified Chinese', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
  });

  it('should switch between Chinese variants', async () => {
    await i18n.changeLanguage('zh-TW');
    expect(i18n.language).toBe('zh-TW');
    
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
  });

  it('should switch from English to Japanese', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    
    await i18n.changeLanguage('ja');
    expect(i18n.language).toBe('ja');
  });

  it('should emit languageChanged event when language changes', async () => {
    const callback = vi.fn();
    i18n.on('languageChanged', callback);
    
    await i18n.changeLanguage('zh-TW');
    expect(callback).toHaveBeenCalledWith('zh-TW');
    
    i18n.off('languageChanged', callback);
  });
});
