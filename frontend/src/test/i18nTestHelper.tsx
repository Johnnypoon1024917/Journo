/**
 * i18n Test Helper
 * 
 * Provides utilities for testing components that use i18n translations.
 * This helper provides translation mappings for common test assertions.
 */

import React from 'react';

/**
 * Translation map for common test assertions
 * Maps translation keys to their English values
 */
export const translations = {
  // Navigation (BubbleQuest namespace)
  'navigation.schedule': 'Schedule',
  'navigation.booking': 'Booking',
  'navigation.budget': 'Budget',
  'navigation.shopping': 'Shopping',
  'navigation.checklist': 'Checklist',
  'navigation.members': 'Members',
  'navigation.settings': 'Settings',
  
  // Common actions
  'actions.save': 'Save',
  'actions.cancel': 'Cancel',
  'actions.delete': 'Delete',
  'actions.edit': 'Edit',
  'actions.add': 'Add',
  'actions.close': 'Close',
  'actions.back': 'Back',
  'actions.next': 'Next',
  
  // Status messages
  'status.loading': 'Loading...',
  'status.saving': 'Saving...',
  'status.saved': 'Saved',
  'status.error': 'Error',
  'status.success': 'Success',
  
  // Shopping
  'shopping.title': 'Shopping List',
  'shopping.addItem': 'Add Item',
  'shopping.noItems': 'Shopping list is empty',
  
  // Checklist
  'checklist.title': 'Preparation List',
  'checklist.addItem': 'Add Item',
  'checklist.noItems': 'List is empty',
  
  // Schedule
  'schedule.noActivities': 'No activities planned yet',
  'schedule.addActivity': 'Add Activity',
  
  // Booking
  'booking.title': 'Booking Management',
  'booking.addBooking': 'Add Booking',
  'booking.noBookings': 'No bookings yet',
};

/**
 * Get translated text for a key
 * This is a simple lookup that returns the English translation
 */
export const getTranslation = (key: string): string => {
  return translations[key as keyof typeof translations] || key;
};

/**
 * Mock translation function for tests
 * Handles both simple keys and interpolation
 */
export const mockT = (key: string, options?: any): string => {
  const translation = getTranslation(key);
  
  // Handle interpolation
  if (options && typeof options === 'object') {
    let result = translation;
    Object.keys(options).forEach(optKey => {
      if (optKey !== 'ns' && optKey !== 'defaultValue') {
        result = result.replace(`{{${optKey}}}`, String(options[optKey]));
      }
    });
    return result;
  }
  
  return translation;
};
