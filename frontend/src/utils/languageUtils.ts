import i18n from '../i18n/config';
import { AuthService } from '../services/authService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

/**
 * Change the application language and save preference to backend
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export async function changeLanguage(language: string): Promise<void> {
  // Change language in i18n
  await i18n.changeLanguage(language);
  
  // Save to localStorage
  localStorage.setItem('i18nextLng', language);
  
  // Try to save to backend if user is logged in
  try {
    const { user, accessToken } = useEnhancedAuthStore.getState();
    
    if (user && accessToken) {
      // Save to backend
      const response = await AuthService.updateLanguage(accessToken, language);
      
      // Update the user in the store with the new language
      useEnhancedAuthStore.setState({
        user: {
          ...user,
          language: language
        }
      });
      
      console.log('✅ Language preference saved to backend:', language);
    }
  } catch (error) {
    console.error('Failed to save language preference to backend:', error);
    // Don't throw - language change still works locally
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): string {
  return i18n.language || 'zh-TW';
}

/**
 * Get available languages
 */
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];
}
