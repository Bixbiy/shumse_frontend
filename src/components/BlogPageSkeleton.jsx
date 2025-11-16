// ── src/components/BlogPageSkeleton.jsx ──
// This is the new skeleton loader that replaces the fullscreen spinner.

import React from 'react';

const SkeletonElement = ({ className }) => <div className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`} />;

const BlogPageSkeleton = () => {
    return (
        <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            {/* Banner Skeleton */}
            <SkeletonElement className="aspect-video w-full" />

            {/* Title Skeleton */}
            <SkeletonElement className="h-12 w-3/4 mt-12" />
            <SkeletonElement className="h-12 w-1/2 mt-4" />

            {/* Author/Meta Skeleton */}
            <div className="flex flex-wrap justify-between items-center my-8 gap-4">
                <div className="flex items-center gap-5">
                    <SkeletonElement className="w-12 h-12 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <SkeletonElement className="h-5 w-32" />
                        <SkeletonElement className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SkeletonElement className="h-5 w-24" />
                    <SkeletonElement className="h-5 w-20" />
                </div>
            </div>

            {/* Interaction Skeleton */}
            <hr className="border-dark-grey/50 my-3" />
            <div className="flex justify-between">
                <div className="flex gap-3 items-center">
                    <SkeletonElement className="w-10 h-10 rounded-full" />
                    <SkeletonElement className="h-6 w-8" />
                    <SkeletonElement className="w-10 h-10 rounded-full" />
                    <SkeletonElement className="h-6 w-8" />
                </div>
                <div className="flex gap-4 items-center">
                    <SkeletonElement className="w-10 h-10 rounded-full" />
                </div>
            </div>
            <hr className="border-dark-grey/50 my-3" />

            {/* Content Skeleton */}
            <div className="my-12 flex flex-col gap-4">
                <SkeletonElement className="h-6 w-full" />
                <SkeletonElement className="h-6 w-full" />
                <SkeletonElement className="h-6 w-11/12" />
                <br />
                <SkeletonElement className="h-6 w-full" />
                <SkeletonElement className="h-6 w-10/12" />
                <br />
                <SkeletonElement className="h-48 w-full" /> {/* Image skeleton */}
                <br />
                <SkeletonElement className="h-6 w-full" />
                <SkeletonElement className="h-6 w-11/12" />
            </div>
        </div>
    );
};

export default BlogPageSkeleton;