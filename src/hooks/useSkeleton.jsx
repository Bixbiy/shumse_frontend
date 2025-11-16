import React, { useState, useCallback } from 'react';

/**
 * useSkeleton
 * @param {number} count — how many skeleton cards to render
 * @returns {{
 *   isLoading: boolean,
 *   showSkeleton: (flag: boolean) => void,
 *   Skeletons: () => React.ReactNode
 * }}
 */
export function useSkeleton(count = 8) {
  const [isLoading, setIsLoading] = useState(false);

  // Toggle skeleton display
  const showSkeleton = useCallback((flag) => {
    setIsLoading(flag);
  }, []);

  // Render `count` semantic skeleton cards
  const Skeletons = useCallback(() => (
    Array.from({ length: count }).map((_, i) => (
      <article
        key={i}
        role="status"
        aria-busy="true"
        aria-label="Loading story"
        className="animate-pulse bg-gray-200 rounded-2xl overflow-hidden"
      >
        {/* Image placeholder */}
        <div className="h-48 bg-gray-300" />

        {/* Text placeholders */}
        <div className="p-4">
          <div className="h-6 bg-gray-300 mb-2 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </article>
    ))
  ), [count]);

  return { isLoading, showSkeleton, Skeletons };
}
