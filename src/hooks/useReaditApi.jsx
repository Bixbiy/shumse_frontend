/*
 * MODIFIED FILE (Complete Rewrite - No TanStack Query)
 * Path: src/hooks/useReaditApi.jsx
 */
import { useState, useEffect, useContext } from 'react';
import { userContext } from '../App';
import api from '../common/api';
import { toast } from 'react-hot-toast';

// ==========================================
// 1. DATA FETCHING HOOKS
// ==========================================

// --- Private Home Feed ---
export const useHomeFeed = (sort) => {
    const { userAuth } = useContext(userContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Reset when sort changes
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
    }, [sort]);

    useEffect(() => {
        if (!userAuth.access_token) {
            setLoading(false);
            return; 
        }

        const fetchData = async () => {
            try {
                const { data } = await api.get(`/readit/posts/feed?sort=${sort}&page=${page}&limit=10`);
                
                if (page === 1) {
                    setPosts(data.posts);
                } else {
                    setPosts(prev => [...prev, ...data.posts]);
                }
                
                setHasMore(data.hasMore);
            } catch (err) {
                console.error(err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sort, page, userAuth.access_token]);

    const fetchNextPage = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    return { posts, loading, error, hasMore, fetchNextPage, setPosts };
};

// --- Public Feed ---
export const usePublicFeed = (sort) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
    }, [sort]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get(`/readit/posts/public?sort=${sort}&page=${page}&limit=10`);
                if (page === 1) setPosts(data.posts);
                else setPosts(prev => [...prev, ...data.posts]);
                setHasMore(data.hasMore);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sort, page]);

    const fetchNextPage = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    return { posts, loading, hasMore, fetchNextPage, setPosts };
};

// --- Community Posts ---
export const useCommunityPosts = (communityName, sort) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
    }, [communityName, sort]);

    useEffect(() => {
        if (!communityName) return;
        const fetchData = async () => {
            try {
                const { data } = await api.get(`/readit/c/${communityName}/posts?sort=${sort}&page=${page}&limit=10`);
                if (page === 1) setPosts(data.posts);
                else setPosts(prev => [...prev, ...data.posts]);
                setHasMore(data.hasMore);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [communityName, sort, page]);

    const fetchNextPage = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    return { posts, loading, hasMore, fetchNextPage, setPosts };
};

// --- Single Community Info ---
export const useCommunity = (communityName) => {
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!communityName) return;
        const fetchCommunity = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/readit/c/${communityName}`);
                setCommunity(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunity();
    }, [communityName]);

    return { community, loading, error };
};

// --- Single Post Info ---
export const useReaditPost = (postId) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!postId) return;
        const fetchPost = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/readit/posts/${postId}`);
                setPost(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    return { post, loading, error, setPost };
};

// --- Post Comments ---
export const usePostComments = (postId, sort) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setComments([]);
        setPage(1);
        setLoading(true);
    }, [postId, sort]);

    useEffect(() => {
        if (!postId) return;
        const fetchComments = async () => {
            try {
                const { data } = await api.get(`/readit/posts/${postId}/comments?sort=${sort}&page=${page}&limit=15`);
                if (page === 1) setComments(data.comments);
                else setComments(prev => [...prev, ...data.comments]);
                setHasMore(data.hasMore);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [postId, sort, page]);

    const fetchNextPage = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    return { comments, loading, hasMore, fetchNextPage, setComments };
};

// --- Comment Replies ---
export const useCommentReplies = (commentId) => {
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (!commentId) return;
        const fetchReplies = async () => {
            try {
                const { data } = await api.get(`/readit/comments/${commentId}/replies?page=${page}&limit=5`);
                if (page === 1) setReplies(data.replies);
                else setReplies(prev => [...prev, ...data.replies]);
                setHasMore(data.hasMore);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReplies();
    }, [commentId, page]);

    const fetchNextPage = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    return { replies, loading, hasMore, fetchNextPage, setReplies };
};

// --- Popular Communities ---
export const usePopularCommunities = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/readit/communities/popular')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading };
};


// ==========================================
// 2. ASYNC MUTATION FUNCTIONS (Called directly by components)
// ==========================================

export const createReaditPost = async (postData) => {
    const { communityName, title, content, postType, url, image, flair } = postData;
    return await api.post(`/readit/c/${communityName}/posts`, {
        title, content, postType, url, image, flair
    });
};

export const createReaditCommunity = async (data) => {
    return await api.post(`/readit/communities`, data);
};

export const joinCommunity = async (communityName) => {
    return await api.post(`/readit/c/${communityName}/join`);
};

export const votePost = async (postId, voteType) => {
    return await api.put(`/readit/posts/${postId}/vote`, { voteType });
};

export const voteComment = async (commentId, voteType) => {
    return await api.put(`/readit/comments/${commentId}/vote`, { voteType });
};

export const createComment = async (postId, content, parent = null) => {
    return await api.post(`/readit/posts/${postId}/comments`, { content, parent });
};