/*
 * MODIFIED FILE
 * Path: src/common/api.jsx
 */
import axios from "axios";

// Local variable to store token in memory (avoids slow sessionStorage parsing on every request)
let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

const api = axios.create({
    baseURL: `${import.meta.env.VITE_SERVER_DOMAIN}/api/v1`,
});

// Optimized interceptor: reads from memory variable
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

export default api;