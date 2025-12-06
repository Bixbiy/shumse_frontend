/*
 * ENHANCED API CLIENT - Phase 5 Improvements
 * Path: src/common/api.jsx
 * 
 * Features:
 * - Request deduplication (prevents duplicate in-flight requests)
 * - In-memory caching with TTL
 * - Retry logic with exponential backoff
 * - Auto-refresh auth token from sessionStorage
 */
import axios from "axios";

// ============================================================================
// Configuration
// ============================================================================

// Local variable to store token in memory
let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

// Helper to get token (checks memory first, then sessionStorage)
const getAuthToken = () => {
    if (authToken) return authToken;

    try {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed?.access_token) {
                authToken = parsed.access_token; // Cache in memory
                return authToken;
            }
        }
    } catch (e) {
        // Ignore parse errors
    }
    return null;
};

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
    '/latest-posts': 60000,
    '/trending-posts': 120000,
    '/get-post': 300000,
    '/get-profile': 180000,
    '/get-post-comments': 120000,
    '/similar/posts': 180000,
    '/category-find': 60000,
    'default': 60000
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

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

    if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey);
    }

    const requestPromise = executeRequest()
        .finally(() => {
            pendingRequests.delete(requestKey);
        });

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

    if (now - timestamp < ttl) {
        return data;
    }

    cache.delete(cacheKey);
    return null;
};

const setCachedData = (cacheKey, data, endpoint) => {
    const ttl = CACHE_TTL[endpoint] || CACHE_TTL.default;
    cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
};

const invalidateCache = (pattern) => {
    const keysToDelete = [];
    for (const [key] of cache) {
        if (key.includes(pattern)) {
            keysToDelete.push(key);
        }
    }
    keysToDelete.forEach(key => cache.delete(key));
};

export const clearCache = () => {
    cache.clear();
};

export const invalidateCachePattern = invalidateCache;

// ============================================================================
// Retry Logic
// ============================================================================

const shouldRetry = (error, attempt) => {
    if (attempt >= MAX_RETRIES) return false;
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false;
    }
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
            if (!shouldRetry(error, attempt)) throw error;
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
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

// Request interceptor - adds auth token with sessionStorage fallback
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handles caching, deduplication, and retry
const originalRequest = api.request.bind(api);

api.request = async function enhancedRequest(config) {
    const method = (config.method || 'get').toUpperCase();
    const endpoint = config.url;

    if (method === 'GET') {
        const cacheKey = getCacheKey(config);
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return Promise.resolve(cachedData);
        }

        return deduplicateRequest(config, async () => {
            const response = await retryRequest(
                () => originalRequest(config),
                config
            );
            setCachedData(cacheKey, response, endpoint);
            return response;
        });
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        invalidateCache(endpoint);
        return retryRequest(() => originalRequest(config), config);
    }

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