// ── src/components/MinimalPostCardSkeleton.jsx ──
// A new skeleton loader for the minimal trending posts.

import React from 'react';

const MinimalPostCardSkeleton = () => {
    return (
        <div className="flex gap-4 items-center border-b border-dark-grey border-opacity-30 pb-4 mb-6">
            {/* Index */}
            <div className="w-10 shrink-0">
                <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 animate-pulse">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 ml-auto"></div>
                </div>

                {/* Title & Banner */}
                <div className="flex justify-between gap-4">
                    <div className="w-full">
                        <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0"></div>
                </div>
            </div>
        </div>
    );
};

export default MinimalPostCardSkeleton;