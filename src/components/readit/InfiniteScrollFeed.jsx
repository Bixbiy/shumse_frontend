/*
 * PATH: src/components/readit/InfiniteScrollFeed.jsx
 * Infinite scroll wrapper with real-time updates
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReaditPostCard from './ReaditPostCard';
import { useSocket } from '../../context/SocketContext';

// Skeleton for loading state
const PostSkeleton = () => (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-800 animate-pulse">
        <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="flex gap-4">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

const InfiniteScrollFeed = ({
    posts,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    communityId
}) => {
    const loadMoreRef = useRef(null);
    const { socket } = useSocket();

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingMore && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, loadMore]);

    // Animation variants for staggered list
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    // Initial loading
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <PostSkeleton key={i} />)}
            </div>
        );
    }

    // Empty state
    if (posts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-neutral-900 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800"
            >
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <i className="fi fi-rr-document text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Be the first to share something!
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    {posts.map((post, index) => (
                        <motion.div
                            key={post._id}
                            variants={itemVariants}
                            layout
                            layoutId={post._id}
                        >
                            <ReaditPostCard post={post} />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
                <div ref={loadMoreRef} className="py-4">
                    {isFetchingMore && (
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                Loading more posts...
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* End of Feed */}
            {!hasMore && posts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center"
                >
                    <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <i className="fi fi-rr-check-circle"></i>
                        <span>You've seen all posts</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default InfiniteScrollFeed;
