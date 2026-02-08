/**
 * Legacy auth store - now just re-exports enhancedAuthStore
 * This file is kept for backward compatibility but all code should use enhancedAuthStore directly
 * 
 * @deprecated Use enhancedAuthStore instead
 */

export { useEnhancedAuthStore as useAuthStore } from './enhancedAuthStore';
export default useEnhancedAuthStore;

// Re-export for compatibility
import { useEnhancedAuthStore } from './enhancedAuthStore';
export { useEnhancedAuthStore };
