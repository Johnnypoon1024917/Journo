/**
 * LanguageSelector Component
 * 
 * A dropdown selector for changing the app's language.
 * Supports English, Traditional Chinese, Simplified Chinese, and Japanese.
 * Changes are applied immediately.
 * 
 * Features:
 * - Dropdown with supported languages
 * - Apply language change immediately
 * - Flag icons for visual identification
 * - Current language highlighting
 * - Touch-optimized
 * 
 * Requirements: 20.1, 20.3
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { Card } from './Card';

export interface LanguageSelectorProps {
  className?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    flag: '🇹🇼',
  },
  {
    code: 'zh-CN',
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-4">
        Language
      </h3>
      
      <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6">
        Choose your preferred language for the app interface
      </p>

      {/* Language Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-3',
            'px-4 py-3 rounded-xl',
            'min-h-[44px]',
            'border-2 transition-all',
            'bg-white dark:bg-kawaii-neutral-800',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-kawaii-primary-500/20',
            isOpen
              ? 'border-kawaii-primary-500 ring-2 ring-kawaii-primary-500/20'
              : 'border-kawaii-neutral-200 dark:border-kawaii-neutral-700 hover:border-kawaii-neutral-300 dark:hover:border-kawaii-neutral-600'
          )}
          aria-label="Select language"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={currentLanguage.name}>
              {currentLanguage.flag}
            </span>
            <div className="text-left">
              <div className="font-medium text-kawaii-neutral-800 dark:text-kawaii-neutral-100">
                {currentLanguage.nativeName}
              </div>
              <div className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                {currentLanguage.name}
              </div>
            </div>
          </div>
          
          <motion.svg
            className="w-5 h-5 text-kawaii-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute z-50 w-full mt-2',
                'bg-white dark:bg-kawaii-neutral-800',
                'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
                'rounded-xl shadow-lg overflow-hidden'
              )}
              role="listbox"
            >
              {languages.map((language, index) => {
                const isSelected = language.code === i18n.language;
                
                return (
                  <motion.button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    className={cn(
                      'w-full flex items-center justify-between gap-3',
                      'px-4 py-3 transition-colors',
                      'min-h-[44px]',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kawaii-primary-500/20',
                      isSelected && 'bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20',
                      index !== languages.length - 1 && 'border-b border-kawaii-neutral-100 dark:border-kawaii-neutral-700'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-label={language.name}>
                        {language.flag}
                      </span>
                      <div className="text-left">
                        <div
                          className={cn(
                            'font-medium',
                            isSelected
                              ? 'text-kawaii-primary-700 dark:text-kawaii-primary-300'
                              : 'text-kawaii-neutral-800 dark:text-kawaii-neutral-100'
                          )}
                        >
                          {language.nativeName}
                        </div>
                        <div className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                          {language.name}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-kawaii-primary-600 dark:text-kawaii-primary-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Language Info */}
      <motion.div
        key={i18n.language}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 rounded-lg bg-kawaii-neutral-50 dark:bg-kawaii-neutral-800 border border-kawaii-neutral-200 dark:border-kawaii-neutral-700"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-kawaii-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
              <span className="font-medium">Current language: {currentLanguage.nativeName}</span>
              <br />
              All UI text, dates, and numbers will be formatted according to this language.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Live Preview Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-lg bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20 border border-kawaii-primary-200 dark:border-kawaii-primary-800"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-kawaii-primary-500 animate-pulse" />
          <p className="text-xs text-kawaii-primary-700 dark:text-kawaii-primary-300">
            Language changes are applied immediately across the app
          </p>
        </div>
      </motion.div>
    </Card>
  );
};
