/*
 * PATH: src/hooks/useReadit.jsx
 * FIXED: Removed call to non-existent /votes/status endpoint
 * Backend already provides userVote in post responses
 */
import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import axiosInstance from '../common/api';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App';
import { useSocket } from '../context/SocketContext';

export const useReadit = (initialSort = 'hot', communityName = null) => {
    const { userAuth } = useContext(UserContext);
    const { socket } = useSocket();

    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [sort, setSort] = useState(initialSort);
    const [activeTab, setActiveTab] = useState('Popular Posts');

    const page = useRef(1);
    const hasMore = useRef(true);

    const isLoggedIn = !!userAuth?.access_token;

    // Fetch posts function
    const fetchPosts = useCallback(async (isReset = false) => {
        if (isReset) {
            page.current = 1;
            hasMore.current = true;
            setPosts([]);
            setIsLoading(true);
        } else {
            if (isFetchingMore || !hasMore.current) return;
            setIsFetchingMore(true);
        }

        // Determine Endpoint
        let endpoint = '/readit/posts/public';
        if (communityName) {
            endpoint = `/readit/c/${communityName}/posts`;
        } else if (activeTab === 'Your Feed' && isLoggedIn) {
            endpoint = '/readit/posts/feed';
        }

        try {
            const { data } = await axiosInstance.get(`${endpoint}?sort=${sort}&page=${page.current}&limit=10`);

            // Backend already returns userVote in each post!
            // No need to call separate /votes/status endpoint
            const postsWithVotes = (data.posts || []).map(post => ({
                ...post,
                // Convert null to 'none' for consistency
                userVote: post.userVote || 'none'
            }));

            if (isReset) {
                setPosts(postsWithVotes);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p._id));
                    const newPosts = postsWithVotes.filter(p => !existingIds.has(p._id));
                    return [...prev, ...newPosts];
                });
            }

            hasMore.current = data.hasMore ?? false;
            page.current += 1;

        } catch (err) {
            console.error("Failed to fetch posts:", err);
            if (isReset) toast.error("Could not load posts");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [activeTab, sort, isLoggedIn, communityName, isFetchingMore]);

    // Reset when dependencies change
    useEffect(() => {
        if (!isLoggedIn && activeTab === 'Your Feed') {
            setActiveTab('Popular Posts');
            return;
        }
        fetchPosts(true);
    }, [activeTab, sort, isLoggedIn, communityName]);

    // Real-time: Listen for new posts
    useEffect(() => {
        if (!socket) return;

        const handleNewPost = (post) => {
            if (communityName && post.community?.name !== communityName) return;
            if (activeTab === 'Your Feed' && !post.inUserFeed) return;

            setPosts(prev => {
                if (prev.find(p => p._id === post._id)) return prev;
                return [{ ...post, isNew: true, userVote: 'none' }, ...prev];
            });
        };

        const handlePostUpdate = (updated) => {
            setPosts(prev => prev.map(p =>
                p._id === updated._id ? { ...p, ...updated } : p
            ));
        };

        const handlePostDelete = (postId) => {
            setPosts(prev => prev.filter(p => p._id !== postId));
        };

        const handleVoteUpdate = (data) => {
            setPosts(prev => prev.map(p =>
                p._id === data.itemId ? { ...p, score: data.score } : p
            ));
        };

        socket.on('newReaditPost', handleNewPost);
        socket.on('postUpdated', handlePostUpdate);
        socket.on('postDeleted', handlePostDelete);
        socket.on('postVoteUpdate', handleVoteUpdate);

        return () => {
            socket.off('newReaditPost', handleNewPost);
            socket.off('postUpdated', handlePostUpdate);
            socket.off('postDeleted', handlePostDelete);
            socket.off('postVoteUpdate', handleVoteUpdate);
        };
    }, [socket, communityName, activeTab]);

    const refresh = useCallback(async () => {
        await fetchPosts(true);
    }, [fetchPosts]);

    const loadMore = useCallback(() => {
        if (!isFetchingMore && hasMore.current) {
            fetchPosts(false);
        }
    }, [fetchPosts, isFetchingMore]);

    return {
        posts,
        isLoading,
        isFetchingMore,
        hasMore: hasMore.current,
        sort,
        setSort,
        activeTab,
        setActiveTab,
        loadMore,
        refresh,
        isLoggedIn
    };
};
