/**
 * useErrorHandler Hook
 * 
 * Custom hook for component-level error handling with:
 * - State management for errors
 * - Automatic toast notifications
 * - Error clearing
 * - Integration with centralized error handler
 */

import { useState, useCallback } from 'react';
import { handleApiError, getErrorMessage } from '../utils/errorHandler';

/**
 * useErrorHandler Hook
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.showToast - Whether to show toast notifications (default: true)
 * @param {Function} options.onError - Callback function when error occurs
 * @returns {Object} Error handling utilities
 */
export const useErrorHandler = (options = {}) => {
    const { showToast = true, onError } = options;

    const [error, setError] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    /**
     * Handle error
     */
    const handleError = useCallback((err, customMessage = null, context = {}) => {
        const message = getErrorMessage(err);

        setError(err);
        setErrorMessage(message);

        // Show toast if enabled
        if (showToast) {
            handleApiError(err, customMessage, context);
        }

        // Call custom error handler if provided
        if (onError) {
            onError(err, message);
        }

        return message;
    }, [showToast, onError]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
        setErrorMessage('');
    }, []);

    /**
     * Check if there's an active error
     */
    const hasError = error !== null;

    return {
        error,
        errorMessage,
        hasError,
        handleError,
        clearError,
    };
};

export default useErrorHandler;
