/*
 * ENHANCED API CLIENT - Phase 5 Improvements
 * Path: src/common/api.jsx
 * 
 * Features:
 * - Request deduplication (prevents duplicate in-flight requests)
 * - In-memory caching with TTL
 * - Retry logic with exponential backoff
 */
import axios from "axios";

// ============================================================================
// Configuration
// ============================================================================

// Local variable to store token in memory (avoids slow sessionStorage parsing on every request)
let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
    '/latest-posts': 60000,           // 1 minute
    '/trending-posts': 120000,        // 2 minutes
    '/get-post': 300000,              // 5 minutes
    '/get-profile': 180000,           // 3 minutes
    '/get-post-comments': 120000,     // 2 minutes
    '/similar/posts': 180000,         // 3 minutes
    '/category-find': 60000,          // 1 minute
    'default': 60000                  // 1 minute for unlisted endpoints
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// ============================================================================
// Request Deduplication
// ============================================================================

const pendingRequests = new Map();

const generateRequestKey = (config) => {
    const { method, url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

const deduplicateRequest = async (config, executeRequest) => {
    const requestKey = generateRequestKey(config);

    // If request is already pending, return the existing promise
    if (pendingRequests.has(requestKey)) {
        console.log(`[API] Deduplicating request: ${requestKey}`);
        return pendingRequests.get(requestKey);
    }

    // Create new request promise
    const requestPromise = executeRequest()
        .finally(() => {
            // Remove from pending requests when done
            pendingRequests.delete(requestKey);
        });

    // Store in pending requests map
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
};

// ============================================================================
// In-Memory Cache
// ============================================================================

const cache = new Map();

const getCacheKey = (config) => {
    const { method, url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

const getCachedData = (cacheKey) => {
    const cached = cache.get(cacheKey);
    if (!cached) return null;

    const { data, timestamp, ttl } = cached;
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < ttl) {
        console.log(`[API Cache] HIT: ${cacheKey.substring(0, 50)}...`);
        return data;
    }

    // Cache expired, remove it
    console.log(`[API Cache] EXPIRED: ${cacheKey.substring(0, 50)}...`);
    cache.delete(cacheKey);
    return null;
};

const setCachedData = (cacheKey, data, endpoint) => {
    // Determine TTL for this endpoint
    const ttl = CACHE_TTL[endpoint] || CACHE_TTL.default;

    cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
    });

    console.log(`[API Cache] SET: ${cacheKey.substring(0, 50)}... (TTL: ${ttl}ms)`);
};

const invalidateCache = (pattern) => {
    // Invalidate cache entries matching a pattern (e.g., after mutation)
    const keysToDelete = [];

    for (const [key] of cache) {
        if (key.includes(pattern)) {
            keysToDelete.push(key);
        }
    }

    keysToDelete.forEach(key => {
        cache.delete(key);
        console.log(`[API Cache] INVALIDATED: ${key.substring(0, 50)}...`);
    });
};

// Export for manual cache invalidation if needed
export const clearCache = () => {
    cache.clear();
    console.log('[API Cache] All cache cleared');
};

export const invalidateCachePattern = invalidateCache;

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

const shouldRetry = (error, attempt) => {
    // Don't retry if we've exhausted attempts
    if (attempt >= MAX_RETRIES) return false;

    // Don't retry on client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false;
    }

    // Retry on network errors or server errors (5xx)
    return !error.response || (error.response.status >= 500);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (fn, config) => {
    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (!shouldRetry(error, attempt)) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
            console.log(`[API Retry] Attempt ${attempt + 1}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`);

            await sleep(delay);
        }
    }

    throw lastError;
};

// ============================================================================
// Axios Instance
// ============================================================================

const api = axios.create({
    baseURL: `${import.meta.env.VITE_SERVER_DOMAIN}/api/v1`,
});

// Request interceptor - adds auth token
api.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handles caching, deduplication, and retry
const originalRequest = api.request.bind(api);

api.request = async function enhancedRequest(config) {
    const method = (config.method || 'get').toUpperCase();
    const endpoint = config.url;

    // Only apply optimizations to GET requests
    if (method === 'GET') {
        const cacheKey = getCacheKey(config);

        // Check cache first
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return Promise.resolve(cachedData);
        }

        // Deduplicate and execute request with retry
        return deduplicateRequest(config, async () => {
            const response = await retryRequest(
                () => originalRequest(config),
                config
            );

            // Cache the response
            setCachedData(cacheKey, response, endpoint);

            return response;
        });
    }

    // For mutations (POST, PUT, DELETE, PATCH), invalidate related cache and execute normally
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // Invalidate cache for this endpoint
        invalidateCache(endpoint);

        // Execute with retry (but no caching)
        return retryRequest(() => originalRequest(config), config);
    }

    // Default fallback
    return originalRequest(config);
};

// ============================================================================
// Exports
// ============================================================================

export default api;

// Helper function to fetch comments for a blog post
export const fetchCommentsAPI = async (blogId) => {
    const { data } = await api.post('/get-post-comments', {
        blog_id: blogId,
        skip: 0
    });
    return data;
};