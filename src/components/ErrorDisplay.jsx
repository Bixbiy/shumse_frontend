// ── src/components/ErrorDisplay.jsx ──
// A new component to show a user-friendly error message and a retry button.

import React from 'react';

const ErrorDisplay = ({ message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
            <i className="fi fi-rr-exclamation-triangle text-4xl mb-4"></i>
            <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h2>
            <p className="mb-6">{message || "Failed to load content."}</p>
            <button
                onClick={onRetry}
                className="bg-black text-white py-2 px-6 rounded-full font-semibold transition-all hover:bg-opacity-80"
            >
                Try Again
            </button>
        </div>
    );
};

export default ErrorDisplay;