/**
 * useSocketComments Hook
 * 
 * Centralized socket event handling for blog comments.
 * Eliminates duplicate socket listeners across components.
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * useSocketComments Hook
 * 
 * @param {string} blogId - The blog post ID to listen for comments
 * @param {Function} onNewComment - Callback when new comment is added
 * @param {Function} onCommentUpdate - Callback when comment is updated (likes, edits)
 * @param {Function} onCommentDelete - Callback when comment is deleted
 * @returns {Object} Socket connection status
 */
export const useSocketComments = ({
    blogId,
    onNewComment,
    onCommentUpdate,
    onCommentDelete,
}) => {
    const { socket, isConnected } = useSocket();

    // Join blog room
    useEffect(() => {
        if (!socket || !blogId || !isConnected) return;

        socket.emit('joinBlogRoom', { blog_id: blogId });

        return () => {
            socket.emit('leaveBlogRoom', { blog_id: blogId });
        };
    }, [socket, blogId, isConnected]);

    // Handle new comment
    useEffect(() => {
        if (!socket || !onNewComment) return;

        const handleNewComment = (data) => {
            if (data.blog_id === blogId) {
                onNewComment(data.comment);
            }
        };

        socket.on('newComment', handleNewComment);

        return () => {
            socket.off('newComment', handleNewComment);
        };
    }, [socket, blogId, onNewComment]);

    // Handle comment update (likes, edits)
    useEffect(() => {
        if (!socket || !onCommentUpdate) return;

        const handleCommentUpdate = (data) => {
            if (data.blog_id === blogId) {
                onCommentUpdate(data);
            }
        };

        socket.on('commentUpdated', handleCommentUpdate);
        socket.on('commentLiked', handleCommentUpdate);

        return () => {
            socket.off('commentUpdated', handleCommentUpdate);
            socket.off('commentLiked', handleCommentUpdate);
        };
    }, [socket, blogId, onCommentUpdate]);

    // Handle comment delete
    useEffect(() => {
        if (!socket || !onCommentDelete) return;

        const handleCommentDelete = (data) => {
            if (data.blog_id === blogId) {
                onCommentDelete(data.comment_id);
            }
        };

        socket.on('commentDeleted', handleCommentDelete);

        return () => {
            socket.off('commentDeleted', handleCommentDelete);
        };
    }, [socket, blogId, onCommentDelete]);

    return {
        isConnected,
    };
};

/**
 * useSocketReaditComments Hook
 * 
 * Centralized socket event handling for Readit comments.
 */
export const useSocketReaditComments = ({
    postId,
    onNewComment,
    onCommentVote,
    onCommentDelete,
}) => {
    const { socket, isConnected } = useSocket();

    // Join post room
    useEffect(() => {
        if (!socket || !postId || !isConnected) return;

        socket.emit('joinPostRoom', { post_id: postId });

        return () => {
            socket.emit('leavePostRoom', { post_id: postId });
        };
    }, [socket, postId, isConnected]);

    // Handle new comment
    useEffect(() => {
        if (!socket || !onNewComment) return;

        const handleNewComment = (data) => {
            if (data.post === postId || data.post_id === postId) {
                onNewComment(data);
            }
        };

        socket.on('newReaditComment', handleNewComment);

        return () => {
            socket.off('newReaditComment', handleNewComment);
        };
    }, [socket, postId, onNewComment]);

    // Handle comment vote
    useEffect(() => {
        if (!socket || !onCommentVote) return;

        const handleCommentVote = (data) => {
            onCommentVote(data);
        };

        socket.on('readitCommentVoted', handleCommentVote);

        return () => {
            socket.off('readitCommentVoted', handleCommentVote);
        };
    }, [socket, onCommentVote]);

    // Handle comment delete
    useEffect(() => {
        if (!socket || !onCommentDelete) return;

        const handleCommentDelete = (data) => {
            if (data.post_id === postId) {
                onCommentDelete(data.comment_id);
            }
        };

        socket.on('readitCommentDeleted', handleCommentDelete);

        return () => {
            socket.off('readitCommentDeleted', handleCommentDelete);
        };
    }, [socket, postId, onCommentDelete]);

    return {
        isConnected,
    };
};

/**
 * useSocketReaditPosts Hook
 * 
 * Centralized socket event handling for Readit posts (voting, updates).
 */
export const useSocketReaditPosts = ({
    communityName,
    onPostVote,
    onNewPost,
    onPostUpdate,
}) => {
    const { socket, isConnected } = useSocket();

    // Join community room
    useEffect(() => {
        if (!socket || !communityName || !isConnected) return;

        socket.emit('joinCommunity', { community: communityName });

        return () => {
            socket.emit('leaveCommunity', { community: communityName });
        };
    }, [socket, communityName, isConnected]);

    // Handle post vote
    useEffect(() => {
        if (!socket || !onPostVote) return;

        const handlePostVote = (data) => {
            onPostVote(data);
        };

        socket.on('readitPostVoted', handlePostVote);

        return () => {
            socket.off('readitPostVoted', handlePostVote);
        };
    }, [socket, onPostVote]);

    // Handle new post
    useEffect(() => {
        if (!socket || !onNewPost) return;

        const handleNewPost = (data) => {
            onNewPost(data);
        };

        socket.on('newReaditPost', handleNewPost);

        return () => {
            socket.off('newReaditPost', handleNewPost);
        };
    }, [socket, onNewPost]);

    // Handle post update
    useEffect(() => {
        if (!socket || !onPostUpdate) return;

        const handlePostUpdate = (data) => {
            onPostUpdate(data);
        };

        socket.on('readitPostUpdated', handlePostUpdate);

        return () => {
            socket.off('readitPostUpdated', handlePostUpdate);
        };
    }, [socket, onPostUpdate]);

    return {
        isConnected,
    };
};

export default {
    useSocketComments,
    useSocketReaditComments,
    useSocketReaditPosts,
};
