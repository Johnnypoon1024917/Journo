/**
 * Validation Schemas
 * 
 * Yup schemas for form validation throughout the app
 * Provides type-safe, reusable validation rules
 */

import * as Yup from 'yup';

/**
 * Registration Form Schema
 */
export const registrationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
});

/**
 * Login Form Schema
 */
export const loginSchema = Yup.object({
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  
  password: Yup.string()
    .required('Password is required'),
  
  rememberMe: Yup.boolean(),
});

/**
 * Trip Creation Schema
 */
export const tripSchema = Yup.object({
  title: Yup.string()
    .required('Trip title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  destination: Yup.string()
    .nullable()
    .max(255, 'Destination must be less than 255 characters'),
  
  start_date: Yup.date()
    .nullable()
    .min(new Date(), 'Start date cannot be in the past'),
  
  end_date: Yup.date()
    .nullable()
    .min(Yup.ref('start_date'), 'End date must be after start date'),
  
  budget: Yup.number()
    .nullable()
    .positive('Budget must be a positive number')
    .max(1000000000, 'Budget is too large'),
  
  currency: Yup.string()
    .oneOf(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'SGD', 'AUD', 'CAD'], 'Invalid currency'),
});

/**
 * Place Creation Schema
 */
export const placeSchema = Yup.object({
  name: Yup.string()
    .required('Place name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  
  address: Yup.string()
    .nullable()
    .max(500, 'Address must be less than 500 characters'),
  
  time_start: Yup.string()
    .nullable()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  time_end: Yup.string()
    .nullable()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  notes: Yup.string()
    .nullable()
    .max(1000, 'Notes must be less than 1000 characters'),
  
  cost: Yup.number()
    .nullable()
    .positive('Cost must be a positive number')
    .max(1000000, 'Cost is too large'),
  
  place_type: Yup.string()
    .nullable()
    .oneOf(['attraction', 'food', 'hotel', 'transport', 'other'], 'Invalid place type'),
});

/**
 * Budget Entry Schema
 */
export const budgetEntrySchema = Yup.object({
  category: Yup.string()
    .required('Category is required')
    .oneOf(['flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'], 'Invalid category'),
  
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be a positive number')
    .max(1000000, 'Amount is too large'),
  
  description: Yup.string()
    .nullable()
    .max(255, 'Description must be less than 255 characters'),
  
  date: Yup.date()
    .required('Date is required'),
});

/**
 * Profile Update Schema
 */
export const profileSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  
  bio: Yup.string()
    .nullable()
    .max(500, 'Bio must be less than 500 characters'),
});

/**
 * Password Change Schema
 */
export const passwordChangeSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Current password is required'),
  
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password'),
  
  confirmNewPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

/**
 * Feedback Form Schema
 */
export const feedbackSchema = Yup.object({
  subject: Yup.string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  
  message: Yup.string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
});
