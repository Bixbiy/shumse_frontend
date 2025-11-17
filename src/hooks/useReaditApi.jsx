// src/hooks/useReaditApi.js - FIXED VERSION
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useContext } from 'react';
import { userContext } from '../App';
import { toast } from 'react-hot-toast';

// Get the domain from your environment variables
const API_DOMAIN = import.meta.env.VITE_SERVER_DOMAIN + "/api/v1";

// Helper to get auth headers - returns empty object if no token
const getAuthHeaders = (token) => {
    if (!token) return {};
    return {
        'Authorization': `Bearer ${token}`
    };
};

// === API Fetching Hooks ===

// 1. Fetches the user's personalized home feed (requires auth)
export const useHomeFeed = (sort) => {
    const { userAuth } = useContext(userContext);
    
    return useInfiniteQuery({
        queryKey: ['readitFeed', sort],
        queryFn: ({ pageParam = 1 }) => 
            axios.get(`${API_DOMAIN}/readit/posts/feed?sort=${sort}&page=${pageParam}&limit=10`, {
                headers: getAuthHeaders(userAuth?.access_token)
            }).then(res => res.data),
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.page + 1 : undefined;
        },
        enabled: !!userAuth?.access_token // Only enable if user is logged in
    });
};

// 2. Fetches a specific community's details (public)
export const useCommunity = (communityName) => {
    return useQuery({
        queryKey: ['community', communityName],
        queryFn: () => axios.get(`${API_DOMAIN}/readit/c/${communityName}`).then(res => res.data),
        staleTime: 1000 * 60 * 5 // Cache community data for 5 minutes
    });
};

// 3. Fetches a specific community's posts (paginated, public)
export const useCommunityPosts = (communityName, sort) => {
    return useInfiniteQuery({
        queryKey: ['communityPosts', communityName, sort],
        queryFn: ({ pageParam = 1 }) => 
            axios.get(`${API_DOMAIN}/readit/c/${communityName}/posts?sort=${sort}&page=${pageParam}&limit=10`)
                .then(res => res.data),
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.page + 1 : undefined;
        },
        enabled: !!communityName // Only run if communityName is available
    });
};

// 4. Fetches a single post's details (public)
export const useReaditPost = (postId) => {
    return useQuery({
        queryKey: ['readitPost', postId],
        queryFn: () => axios.get(`${API_DOMAIN}/readit/posts/${postId}`).then(res => res.data),
        staleTime: 1000 * 60 * 5,
        enabled: !!postId
    });
};

// 5. Fetches public feed (fixed endpoint)
export const usePublicFeed = (sort) => {
    return useInfiniteQuery({
        queryKey: ['publicFeed', sort],
        queryFn: ({ pageParam = 1 }) => 
            axios.get(`${API_DOMAIN}/readit/posts/public?sort=${sort}&page=${pageParam}&limit=10`)
                .then(res => res.data),
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.page + 1 : undefined;
        }
    });
};

// 6. Fetches popular communities (public)
export const usePopularCommunities = () => {
    return useQuery({
        queryKey: ['popularCommunities'],
        queryFn: () => axios.get(`${API_DOMAIN}/readit/communities/popular`).then(res => res.data),
        staleTime: 1000 * 60 * 30 // Cache for 30 minutes
    });
};

// ===================================
// === Comment Fetching Hooks ===
// ===================================

/**
 * 7. Fetches TOP-LEVEL comments for a post (paginated, public)
 */
export const usePostComments = (postId, sort) => {
    return useInfiniteQuery({
        queryKey: ['readitComments', postId, sort],
        queryFn: ({ pageParam = 1 }) => 
            axios.get(`${API_DOMAIN}/readit/posts/${postId}/comments?sort=${sort}&page=${pageParam}&limit=10`)
                .then(res => res.data),
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.page + 1 : undefined;
        },
        enabled: !!postId
    });
};

/**
 * 8. Fetches replies for a SINGLE comment (paginated, public)
 */
export const useCommentReplies = (commentId) => {
    return useInfiniteQuery({
        queryKey: ['readitCommentReplies', commentId],
        queryFn: ({ pageParam = 1 }) =>
            axios.get(`${API_DOMAIN}/readit/comments/${commentId}/replies?page=${pageParam}&limit=5`)
                .then(res => res.data),
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.page + 1 : undefined;
        },
        enabled: false // Only fetch when explicitly enabled by the component
    });
};

// === API Mutation Hooks (all require auth) ===

/**
 * Hook for voting on a Post
 */
export const useVotePost = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: ({ postId, voteType }) => 
            axios.put(`${API_DOMAIN}/readit/posts/${postId}/vote`, { voteType }, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data, variables) => {
            const { postId } = variables;
            
            // Update the specific post cache
            queryClient.setQueryData(['readitPost', postId], (oldData) => {
                if (!oldData) return oldData;
                return { 
                    ...oldData, 
                    votes: data.data.votes,
                    upvotedBy: data.data.upvotedBy || oldData.upvotedBy,
                    downvotedBy: data.data.downvotedBy || oldData.downvotedBy
                };
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['readitFeed'] });
            queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
            queryClient.invalidateQueries({ queryKey: ['publicFeed'] });
        },
        onError: (err) => {
            console.error("Vote error:", err);
            toast.error(err.response?.data?.error || "Vote failed. Please try again.");
        }
    });
};

/**
 * Hook for voting on a Comment
 */
export const useVoteComment = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: ({ commentId, voteType }) =>
            axios.put(`${API_DOMAIN}/readit/comments/${commentId}/vote`, { voteType }, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['readitComments'] });
            queryClient.invalidateQueries({ queryKey: ['readitCommentReplies'] });
        },
        onError: (err) => {
            console.error("Comment vote error:", err);
            toast.error(err.response?.data?.error || "Vote failed. Please try again.");
        }
    });
};

/**
 * Hook for creating a new Comment
 */
export const useCreateReaditComment = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: ({ postId, content, parent = null }) =>
            axios.post(`${API_DOMAIN}/readit/posts/${postId}/comments`, { content, parent }, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data, variables) => {
            const { postId, parent } = variables;
            
            queryClient.invalidateQueries({ queryKey: ['readitComments', postId] });
            if (parent) {
                queryClient.invalidateQueries({ queryKey: ['readitCommentReplies', parent] });
            }
            queryClient.invalidateQueries({ queryKey: ['readitPost', postId] });
            
            toast.success("Comment posted successfully!");
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Failed to post comment.");
        }
    });
};

/**
 * Hook for creating a new Post
 */
export const useCreateReaditPost = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: ({ communityName, title, content, postType = 'text', url, image, flair }) =>
            axios.post(`${API_DOMAIN}/readit/c/${communityName}/posts`, {
                title,
                content,
                postType,
                url,
                image,
                flair
            }, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['communityPosts', variables.communityName] });
            queryClient.invalidateQueries({ queryKey: ['readitFeed'] });
            queryClient.invalidateQueries({ queryKey: ['publicFeed'] });
            
            toast.success("Post created successfully!");
            
            return data.data;
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Failed to create post.");
        }
    });
};

/**
 * Hook for creating a new Community
 */
export const useCreateReaditCommunity = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: ({ name, title, description, icon }) =>
            axios.post(`${API_DOMAIN}/readit/communities`, {
                name,
                title,
                description,
                icon
            }, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['popularCommunities'] });
            toast.success("Community created successfully!");
            return data.data;
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Failed to create community.");
        }
    });
};

/**
 * Hook for joining/leaving a community
 */
export const useJoinCommunity = () => {
    const queryClient = useQueryClient();
    const { userAuth } = useContext(userContext);

    return useMutation({
        mutationFn: (communityName) =>
            axios.post(`${API_DOMAIN}/readit/c/${communityName}/join`, {}, {
                headers: getAuthHeaders(userAuth?.access_token)
            }),
        
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community', variables] });
            queryClient.invalidateQueries({ queryKey: ['popularCommunities'] });
            
            toast.success("Successfully joined community!");
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Failed to join community.");
        }
    });
};