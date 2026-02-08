import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from '../locales/en/common.json';
import enTrip from '../locales/en/trip.json';
import enPlace from '../locales/en/place.json';
import enBudget from '../locales/en/budget.json';
import enPacking from '../locales/en/packing.json';
import enCommunity from '../locales/en/community.json';
import enSettings from '../locales/en/settings.json';
import enErrors from '../locales/en/errors.json';
import enKawaii from '../locales/en/kawaii.json';

// Import Traditional Chinese translations
import zhTWCommon from '../locales/zh-TW/common.json';
import zhTWTrip from '../locales/zh-TW/trip.json';
import zhTWPlace from '../locales/zh-TW/place.json';
import zhTWBudget from '../locales/zh-TW/budget.json';
import zhTWPacking from '../locales/zh-TW/packing.json';
import zhTWCommunity from '../locales/zh-TW/community.json';
import zhTWSettings from '../locales/zh-TW/settings.json';
import zhTWErrors from '../locales/zh-TW/errors.json';
import zhTWKawaii from '../locales/zh-TW/kawaii.json';

// Import Simplified Chinese translations
import zhCNCommon from '../locales/zh-CN/common.json';
import zhCNTrip from '../locales/zh-CN/trip.json';
import zhCNPlace from '../locales/zh-CN/place.json';
import zhCNBudget from '../locales/zh-CN/budget.json';
import zhCNPacking from '../locales/zh-CN/packing.json';
import zhCNCommunity from '../locales/zh-CN/community.json';
import zhCNSettings from '../locales/zh-CN/settings.json';
import zhCNErrors from '../locales/zh-CN/errors.json';
import zhCNKawaii from '../locales/zh-CN/kawaii.json';

// Import Japanese translations
import jaCommon from '../locales/ja/common.json';
import jaTrip from '../locales/ja/trip.json';
import jaPlace from '../locales/ja/place.json';
import jaBudget from '../locales/ja/budget.json';
import jaPacking from '../locales/ja/packing.json';
import jaCommunity from '../locales/ja/community.json';
import jaSettings from '../locales/ja/settings.json';
import jaErrors from '../locales/ja/errors.json';
import jaKawaii from '../locales/ja/kawaii.json';

// Language detector configuration
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage) {
      return savedLanguage;
    }

    // Detect browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    
    // Map browser locales to supported languages
    if (browserLang.startsWith('zh')) {
      if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('Hant')) {
        return 'zh-TW';
      }
      return 'zh-CN';
    }
    
    if (browserLang.startsWith('ja')) {
      return 'ja';
    }
    
    // Default to English
    return 'en';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        trip: enTrip,
        place: enPlace,
        budget: enBudget,
        packing: enPacking,
        community: enCommunity,
        settings: enSettings,
        errors: enErrors,
        kawaii: enKawaii,
      },
      'zh-TW': {
        common: zhTWCommon,
        trip: zhTWTrip,
        place: zhTWPlace,
        budget: zhTWBudget,
        packing: zhTWPacking,
        community: zhTWCommunity,
        settings: zhTWSettings,
        errors: zhTWErrors,
        kawaii: zhTWKawaii,
      },
      'zh-CN': {
        common: zhCNCommon,
        trip: zhCNTrip,
        place: zhCNPlace,
        budget: zhCNBudget,
        packing: zhCNPacking,
        community: zhCNCommunity,
        settings: zhCNSettings,
        errors: zhCNErrors,
        kawaii: zhCNKawaii,
      },
      ja: {
        common: jaCommon,
        trip: jaTrip,
        place: jaPlace,
        budget: jaBudget,
        packing: jaPacking,
        community: jaCommunity,
        settings: jaSettings,
        errors: jaErrors,
        kawaii: jaKawaii,
      },
    },
    fallbackLng: 'zh-TW',
    lng: 'zh-TW', // Set Traditional Chinese as default
    defaultNS: 'common',
    ns: ['common', 'trip', 'place', 'budget', 'packing', 'community', 'settings', 'errors', 'kawaii'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['customDetector', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
