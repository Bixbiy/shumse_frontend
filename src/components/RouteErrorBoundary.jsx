/**
 * Route Error Boundary
 * 
 * Specialized error boundary for catching and displaying route-level errors.
 * Provides a user-friendly error UI with retry functionality.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

class RouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('[RouteErrorBoundary] Error caught:', error);
        console.error('[RouteErrorBoundary] Error Info:', errorInfo);

        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));

        // In production, send to error tracking service
        // if (process.env.NODE_ENV === 'production') {
        //   Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    errorCount={this.state.errorCount}
                    onReset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Error Fallback UI Component
 */
const ErrorFallback = ({ error, errorInfo, errorCount, onReset }) => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        onReset();
        navigate('/');
    };

    const handleReload = () => {
        onReset();
        window.location.reload();
    };

    const isCritical = errorCount > 2;

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
            >
                <div className="glass-card p-8 md:p-12 text-center">
                    {/* Error Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-error-light dark:bg-error-dark/20 flex items-center justify-center"
                    >
                        <i className="fi fi-rr-exclamation text-5xl text-error"></i>
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
                        Oops! Something went wrong
                    </h1>

                    {/* Message */}
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                        {isCritical
                            ? "We're experiencing persistent issues. Please contact support if this continues."
                            : "Don't worry, we're on it! Try refreshing the page or going back home."}
                    </p>

                    {/* Error Details (Development only) */}
                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="mb-8 text-left">
                            <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 hover:text-primary-600">
                                View Error Details
                            </summary>
                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mt-2 overflow-auto max-h-64">
                                <p className="text-sm font-mono text-error mb-2">
                                    {error.toString()}
                                </p>
                                {errorInfo?.componentStack && (
                                    <pre className="text-xs text-neutral-600 dark:text-neutral-400 overflow-x-auto">
                                        {errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGoHome}
                            className="btn btn-primary"
                        >
                            <i className="fi fi-rr-home"></i>
                            Go to Homepage
                        </button>

                        {!isCritical && (
                            <button
                                onClick={handleReload}
                                className="btn btn-secondary"
                            >
                                <i className="fi fi-rr-refresh"></i>
                                Reload Page
                            </button>
                        )}
                    </div>

                    {/* Additional Help */}
                    <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Need help? Contact our support team at{' '}
                            <a href="mailto:buyshumse@gmail.com" className="text-primary-600 hover:underline">
                                buyshumse@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RouteErrorBoundary;
