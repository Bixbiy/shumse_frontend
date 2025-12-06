/*
 * PATH: src/components/readit/PullToRefresh.jsx
 * Mobile pull-to-refresh functionality
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const PullToRefresh = ({ onRefresh, children, threshold = 80 }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef(null);
    const startY = useRef(0);
    const pullDistance = useMotionValue(0);

    // Transform pull distance to rotation for the spinner
    const rotation = useTransform(pullDistance, [0, threshold], [0, 360]);
    const opacity = useTransform(pullDistance, [0, threshold / 2, threshold], [0, 0.5, 1]);
    const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);

    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            pullDistance.set(Math.min(diff * 0.5, threshold * 1.5));
        }
    }, [isRefreshing, pullDistance, threshold]);

    const handleTouchEnd = useCallback(async () => {
        const currentPull = pullDistance.get();

        if (currentPull >= threshold && !isRefreshing) {
            setIsRefreshing(true);

            try {
                await onRefresh();
            } catch (err) {
                console.error('Refresh failed:', err);
            } finally {
                setIsRefreshing(false);
            }
        }

        pullDistance.set(0);
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative h-full overflow-y-auto"
        >
            {/* Pull Indicator */}
            <motion.div
                style={{
                    height: pullDistance,
                    opacity
                }}
                className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-100 dark:from-gray-800 to-transparent"
            >
                <motion.div
                    style={{ scale, rotate: rotation }}
                    className="w-8 h-8 flex items-center justify-center"
                >
                    {isRefreshing ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <i className="fi fi-rr-refresh text-xl text-blue-500" />
                    )}
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                style={{ y: isRefreshing ? 40 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
