/**
 * Centralized Error Handler
 * 
 * Provides consistent error handling across the application with:
 * - User-friendly error messages
 * - Error type detection
 * - Logging capabilities
 * - Toast notification integration
 */

import toast from 'react-hot-toast';

/**
 * Error Types
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  // Handle axios errors
  if (error.response) {
    // Server responded with error status
    const { data, status } = error.response;
    
    // Check for custom error message from backend
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    
    // Status-based messages
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to do that.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable.';
      default:
        return `Request failed with status ${status}`;
    }
  }
  
  // Handle axios request errors (no response)
  if (error.request) {
    return 'Network error. Please check your connection.';
  }
  
  // Handle other errors
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};

/**
 * Detect error type from error object
 */
export const getErrorType = (error) => {
  // Network errors
  if (!error.response && error.request) {
    return ErrorType.NETWORK;
  }
  
  // Auth errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return ErrorType.AUTH;
  }
  
  // Validation errors
  if (error.response?.status === 400 || error.response?.status === 422) {
    return ErrorType.VALIDATION;
  }
  
  // Not found errors
  if (error.response?.status === 404) {
    return ErrorType.NOT_FOUND;
  }
  
  // Server errors
  if (error.response?.status >= 500) {
    return ErrorType.SERVER;
  }
  
  return ErrorType.UNKNOWN;
};

/**
 * Check if error is authentication-related
 */
export const isAuthError = (error) => {
  return getErrorType(error) === ErrorType.AUTH;
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (error) => {
  return getErrorType(error) === ErrorType.NETWORK;
};

/**
 * Log error to console with context
 */
export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorType = getErrorType(error);
  const message = getErrorMessage(error);
  
  console.group(`[Error] ${errorType} - ${timestamp}`);
  console.error('Message:', message);
  console.error('Error Object:', error);
  
  if (Object.keys(context).length > 0) {
    console.error('Context:', context);
  }
  
  if (error.response) {
    console.error('Response Data:', error.response.data);
    console.error('Response Status:', error.response.status);
  }
  
  console.groupEnd();
  
  // In production, you could send this to an error tracking service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: context });
  // }
};

/**
 * Handle API error with toast notification
 * 
 * @param {Error} error - The error object
 * @param {string} customMessage - Optional custom message to display
 * @param {Object} context - Optional context for logging
 * @returns {string} The error message
 */
export const handleApiError = (error, customMessage = null, context = {}) => {
  const message = customMessage || getErrorMessage(error);
  const errorType = getErrorType(error);
  
  // Log error
  logError(error, { ...context, customMessage });
  
  // Show appropriate toast
  switch (errorType) {
    case ErrorType.AUTH:
      toast.error(message, {
        duration: 4000,
        icon: '🔒',
      });
      break;
      
    case ErrorType.NETWORK:
      toast.error(message, {
        duration: 5000,
        icon: '📡',
      });
      break;
      
    case ErrorType.VALIDATION:
      toast.error(message, {
        duration: 4000,
        icon: '⚠️',
      });
      break;
      
    case ErrorType.NOT_FOUND:
      toast.error(message, {
        duration: 3000,
        icon: '🔍',
      });
      break;
      
    case ErrorType.SERVER:
      toast.error(message, {
        duration: 5000,
        icon: '⚠️',
      });
      break;
      
    default:
      toast.error(message, {
        duration: 4000,
      });
  }
  
  return message;
};

/**
 * Handle network error specifically
 */
export const handleNetworkError = (error, context = {}) => {
  return handleApiError(
    error,
    'Unable to connect. Please check your internet connection.',
    { ...context, type: 'network' }
  );
};

/**
 * Handle form validation error
 */
export const handleValidationError = (error, context = {}) => {
  const message = getErrorMessage(error);
  logError(error, { ...context, type: 'validation' });
  
  // Don't show toast for validation errors, let the form handle it
  return message;
};

/**
 * Show success toast
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show info toast
 */
export const showInfo = (message, options = {}) => {
  toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    ...options,
  });
};

/**
 * Show warning toast
 */
export const showWarning = (message, options = {}) => {
  toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#fed7aa',
      color: '#d97706',
    },
    ...options,
  });
};

/**
 * Create a retry function with exponential backoff
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry auth errors or validation errors
      const errorType = getErrorType(error);
      if (errorType === ErrorType.AUTH || errorType === ErrorType.VALIDATION) {
        throw error;
      }
      
      // Don't retry if it's the last attempt
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

export default {
  handleApiError,
  handleNetworkError,
  handleValidationError,
  getErrorMessage,
  getErrorType,
  isAuthError,
  isNetworkError,
  logError,
  showSuccess,
  showInfo,
  showWarning,
  retryWithBackoff,
  ErrorType,
};
