// ── src/components/PostCardSkeleton.jsx ──
// A new skeleton loader that mimics the PostCard layout.

import React from 'react';

const PostCardSkeleton = () => {
    return (
        <div 
            className="flex gap-6 items-center bg-white/70 shadow-xl border border-blue-100 rounded-2xl p-6 mb-8"
            style={{
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(80, 120, 255, 0.06)'
            }}
        >
            {/* Left Section - Content */}
            <div className="flex-1 min-w-0 animate-pulse">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-1/6 ml-auto"></div>
                </div>

                {/* Title */}
                <div className="h-6 bg-gray-200 rounded w-5/6 mb-1"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>

                {/* Description */}
                <div className="h-4 bg-gray-200 rounded w-full mt-3"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5 mt-1"></div>

                {/* Tags & Likes */}
                <div className="flex items-center mt-5 gap-4">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
            </div>

            {/* Right Section - Banner Image */}
            <div className="w-32 h-32 rounded-xl flex-shrink-0 bg-gray-200 animate-pulse"></div>
        </div>
    );
};

export default PostCardSkeleton;