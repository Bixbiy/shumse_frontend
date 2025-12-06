

/**
 * Prefetches a dynamic import (lazy loaded component)
 * Usage: onMouseEnter={() => prefetchRoute(() => import('./pages/SomePage'))}
 * 
 * @param {Function} importFn - The dynamic import function, e.g., () => import('./page')
 */
export const prefetchRoute = (importFn) => {
    // Execute the import function to trigger the network request
    // The result is cached by the browser/bundler
    try {
        importFn();
        // Optional: Log prefetch for debugging
        // console.log('Prefetching route...', componentPromise);
    } catch (error) {
        // Silently fail if prefetch fails - it's just an optimization
        console.warn('Route prefetch failed:', error);
    }
};
