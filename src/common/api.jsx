// ── src/common/api.js ──
// This new file manages all your API requests.
// It automatically adds the /api/v1 prefix.

import axios from "axios";

// Get the user from session storage
const getSessionUser = () => {
    const data = sessionStorage.getItem("user");
    return data ? JSON.parse(data) : null;
};

const api = axios.create({
    baseURL: `${import.meta.env.VITE_SERVER_DOMAIN}/api/v1`,
});

// Use an interceptor to automatically add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const user = getSessionUser();
        if (user && user.access_token) {
            config.headers['Authorization'] = `Bearer ${user.access_token}`;
        }
         
        return config;
      
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;