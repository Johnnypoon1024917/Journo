// API response and error types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    prev_cursor: string | null;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Common error codes
export enum ApiErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External API errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  GOOGLE_MAPS_ERROR = 'GOOGLE_MAPS_ERROR',
  WEATHER_API_ERROR = 'WEATHER_API_ERROR',
  CURRENCY_API_ERROR = 'CURRENCY_API_ERROR',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Offline errors
  OFFLINE = 'OFFLINE',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  code: ApiErrorCode.VALIDATION_ERROR;
  message: string;
  errors: ValidationError[];
}

// Request options
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  offline_fallback?: boolean;
}

// File upload types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Batch operation types
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data: T;
  id?: string;
}

export interface BatchOperationResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  operation: BatchOperation<T>;
}

export interface BatchResponse<T> {
  results: BatchOperationResult<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
