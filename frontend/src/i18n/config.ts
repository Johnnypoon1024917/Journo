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
import enMembers from '../locales/en/members.json';
import enActivity from '../locales/en/activity.json';
import enCollaboration from '../locales/en/collaboration.json';
import enNewTrip from '../locales/en/newTrip.json';
import enNotifications from '../locales/en/notifications.json';

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
import zhTWMembers from '../locales/zh-TW/members.json';
import zhTWActivity from '../locales/zh-TW/activity.json';
import zhTWCollaboration from '../locales/zh-TW/collaboration.json';
import zhTWNewTrip from '../locales/zh-TW/newTrip.json';
import zhTWNotifications from '../locales/zh-TW/notifications.json';

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
import zhCNMembers from '../locales/zh-CN/members.json';
import zhCNActivity from '../locales/zh-CN/activity.json';
import zhCNCollaboration from '../locales/zh-CN/collaboration.json';
import zhCNNewTrip from '../locales/zh-CN/newTrip.json';
import zhCNNotifications from '../locales/zh-CN/notifications.json';

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
import jaMembers from '../locales/ja/members.json';
import jaActivity from '../locales/ja/activity.json';
import jaCollaboration from '../locales/ja/collaboration.json';
import jaNewTrip from '../locales/ja/newTrip.json';
import jaNotifications from '../locales/ja/notifications.json';

// Language detector configuration
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    // Check if user is logged in and has a language preference from enhanced auth store
    try {
      const authStorage = localStorage.getItem('enhanced-auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        if (authData?.state?.user?.language) {
          console.log('🌐 Loading language from user profile:', authData.state.user.language);
          return authData.state.user.language;
        }
      }
    } catch (e) {
      console.error('Error reading language from auth storage:', e);
    }

    // Check localStorage for i18next language
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage) {
      console.log('🌐 Loading language from localStorage:', savedLanguage);
      return savedLanguage;
    }

    // Detect browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    
    // Map browser locales to supported languages
    if (browserLang.startsWith('zh')) {
      if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('Hant')) {
        console.log('🌐 Detected browser language: zh-TW');
        return 'zh-TW';
      }
      console.log('🌐 Detected browser language: zh-CN');
      return 'zh-CN';
    }
    
    if (browserLang.startsWith('ja')) {
      console.log('🌐 Detected browser language: ja');
      return 'ja';
    }
    
    // Default to English
    console.log('🌐 Using default language: en');
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
        members: enMembers,
        activity: enActivity,
        collaboration: enCollaboration,
        newTrip: enNewTrip,
        notifications: enNotifications,
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
        members: zhTWMembers,
        activity: zhTWActivity,
        collaboration: zhTWCollaboration,
        newTrip: zhTWNewTrip,
        notifications: zhTWNotifications,
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
        members: zhCNMembers,
        activity: zhCNActivity,
        collaboration: zhCNCollaboration,
        newTrip: zhCNNewTrip,
        notifications: zhCNNotifications,
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
        members: jaMembers,
        activity: jaActivity,
        collaboration: jaCollaboration,
        newTrip: jaNewTrip,
        notifications: jaNotifications,
      },
    },
    fallbackLng: 'en',
    // Remove hardcoded lng to allow detector to work
    defaultNS: 'common',
    ns: ['common', 'trip', 'place', 'budget', 'packing', 'community', 'settings', 'errors', 'kawaii', 'members', 'activity', 'collaboration', 'newTrip', 'notifications'],
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
