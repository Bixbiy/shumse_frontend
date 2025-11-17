import axios from "axios";
import { lookInSession } from "./session";

export const baseURL = import.meta.env.VITE_SERVER_DOMAIN;

const axiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1`,
});

// Interceptor to automatically add the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = lookInSession("user")?.access_token;
    
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const uploadImage = (img) => {
  let formData = new FormData();
  formData.append("image", img);

  return axiosInstance.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- New Readit API functions ---
// We can add specific API functions here for clarity

export const apiCreateReaditPost = (postData) => {
  return axiosInstance.post("/readit/posts", postData);
};

export const apiGetAllReaditPosts = () => {
  return axiosInstance.get("/readit/posts");
};

export const apiGetReaditPost = (postId) => {
  return axiosInstance.get(`/readit/posts/${postId}`);
};

export const apiVoteReaditPost = (postId, voteType) => {
  return axiosInstance.put(`/readit/posts/${postId}/vote`, { voteType });
};

export const apiCreateReaditComment = (postId, commentData) => {
  return axiosInstance.post(`/readit/posts/${postId}/comments`, commentData);
};

export const apiGetReaditComments = (postId) => {
  return axiosInstance.get(`/readit/posts/${postId}/comments`);
};

export const apiVoteReaditComment = (commentId, voteType) => {
  return axiosInstance.put(`/readit/comments/${commentId}/vote`, { voteType });
};

export default axiosInstance;