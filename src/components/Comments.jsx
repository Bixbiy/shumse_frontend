import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { postContext } from '../pages/blog.page';
import { UserContext } from '../App';
import CommentField from './CommentField';
import AnimationWrapper from '../common/page-animation';
import CommentCard from './CommentCard';
import NotFoundMsg from './NoData';
import Loader from '../components/Loader';
import { fetchComments as fetchCommentsAPI } from '../utils/comment.api';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Optimized custom hook
const useCommentsFetcher = (blogId, updateBlogActivity, userId) => {
    const [state, setState] = useState({
        comments: [],
        loading: false,
        error: null,
        page: 0,
        hasMore: true,
        totalCount: 0
    });
    const limit = 5;

    const fetchComments = useCallback(async (page = 0, isRefresh = false) => {
        if (!blogId) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await fetchCommentsAPI(blogId, page, limit, userId);

            setState(prev => ({
                comments: isRefresh ? data.comments : [...prev.comments, ...data.comments],
                loading: false,
                page: page + 1,
                hasMore: data.hasMore,
                totalCount: data.total,
                error: null
            }));

            if (isRefresh && updateBlogActivity) {
                updateBlogActivity(activity => ({
                    ...activity,
                    total_comments: data.total,
                    total_parent_comments: data.total
                }));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setState(prev => ({
                ...prev,
                loading: false,
                error: err.message || 'Failed to load comments'
            }));
        }
    }, [blogId, updateBlogActivity, userId, limit]);

    const setCommentsState = useCallback((updater) => {
        setState(updater);
    }, []);

    useEffect(() => {
        if (blogId) {
            fetchComments(0, true);
        }
    }, [blogId, fetchComments]);

    return { ...state, fetchComments, setCommentsState };
};

// Memoized icons
const ContainerIcons = {
    Close: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Comments: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    Error: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

const CommentsContainer = React.memo(() => {
    const {
        blog,
        commentsWrapper,
        setCommentsWrapper,
        updateBlogActivity
    } = useContext(postContext);

    const { userAuth } = useContext(UserContext);
    const { _id: currentUserId } = userAuth || {};
    const { socket } = useSocket();

    const blogId = blog?._id;
    const title = blog?.title || "";

    const {
        comments,
        loading,
        error,
        page,
        hasMore,
        totalCount,
        fetchComments,
        setCommentsState
    } = useCommentsFetcher(blogId, updateBlogActivity, currentUserId);

    // Optimized socket room joining
    useEffect(() => {
        if (socket && blogId) {
            socket.emit('joinCommentRoom', { blog_id: blogId });
            socket.emit('joinPostRoom', { blog_id: blogId });
        }
    }, [socket, blogId]);

    // Optimized socket listeners
    useEffect(() => {
        if (!socket || !blogId) return;

        const handleNewComment = (newComment) => {
            if (newComment.blog_id === blogId && !newComment.isReply) {
                setCommentsState(prev => ({
                    ...prev,
                    comments: [newComment, ...prev.comments],
                    totalCount: prev.totalCount + 1
                }));
                updateBlogActivity(activity => ({
                    ...activity,
                    total_comments: (activity.total_comments || 0) + 1,
                    total_parent_comments: (activity.total_parent_comments || 0) + 1
                }));
            }
        };

        const handleNewReply = (newReply) => {
            if (newReply.blog_id === blogId && newReply.parent) {
                setCommentsState(prev => ({
                    ...prev,
                    comments: prev.comments.map(comment =>
                        comment._id === newReply.parent
                            ? { ...comment, repliesCount: (comment.repliesCount || 0) + 1 }
                            : comment
                    ),
                    totalCount: prev.totalCount + 1
                }));
                updateBlogActivity(activity => ({
                    ...activity,
                    total_comments: (activity.total_comments || 0) + 1
                }));
            }
        };

        const handleCommentDeleted = (deletedData) => {
            if (deletedData.blog_id === blogId) {
                setCommentsState(prev => {
                    const isTopLevel = prev.comments.some(c => c._id === deletedData._id);
                    return {
                        ...prev,
                        comments: prev.comments.map(comment => {
                            if (comment._id === deletedData._id) {
                                return { ...comment, isDeleted: true, comment: '[deleted]', commented_by: null };
                            }
                            if (comment._id === deletedData.parent) {
                                return { ...comment, repliesCount: Math.max(0, (comment.repliesCount || 1) - 1) };
                            }
                            return comment;
                        }),
                        totalCount: Math.max(0, prev.totalCount - 1),
                        total_parent_comments: isTopLevel ? Math.max(0, prev.totalCount - 1) : prev.totalCount
                    };
                });

                updateBlogActivity(activity => ({
                    ...activity,
                    total_comments: Math.max(0, (activity.total_comments || 1) - 1),
                    total_parent_comments: Math.max(0, (activity.total_parent_comments || 1) - 1)
                }));
            }
        };

        socket.on('newComment', handleNewComment);
        socket.on('newReply', handleNewReply);
        socket.on('commentDeleted', handleCommentDeleted);

        return () => {
            socket.off('newComment', handleNewComment);
            socket.off('newReply', handleNewReply);
            socket.off('commentDeleted', handleCommentDeleted);
        };
    }, [socket, blogId, setCommentsState, updateBlogActivity]);

    // Optimized infinite scroll
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchComments(page);
        }
    }, [fetchComments, loading, hasMore, page]);

    useEffect(() => {
        if (inView) {
            handleLoadMore();
        }
    }, [inView, handleLoadMore]);

    // Memoized content sections
    const headerContent = useMemo(() => (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <ContainerIcons.Comments />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Comments ({totalCount})
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {title}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setCommentsWrapper(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close comments"
                >
                    <ContainerIcons.Close />
                </button>
            </div>
        </div>
    ), [totalCount, title, setCommentsWrapper]);

    return (
        <AnimatePresence>
            {commentsWrapper && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
                    onClick={() => setCommentsWrapper(false)}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {headerContent}

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-4 space-y-6">
                                <CommentField action="comment" />

                                {error && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
                                        <ContainerIcons.Error />
                                        <p className="mt-2 text-sm">{error}</p>
                                        <button
                                            onClick={() => fetchComments(0, true)}
                                            className="mt-3 text-xs font-medium underline hover:text-red-600"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <AnimationWrapper key={comment._id}>
                                            <CommentCard
                                                index={0}
                                                leftVal={0}
                                                commentData={comment}
                                            />
                                        </AnimationWrapper>
                                    ))}
                                </div>

                                {loading && (
                                    <div className="flex justify-center py-4">
                                        <Loader />
                                    </div>
                                )}

                                {!loading && !hasMore && comments.length > 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        End of comments
                                    </div>
                                )}

                                {!loading && comments.length === 0 && !error && (
                                    <NotFoundMsg message="No comments yet. Be the first to share your thoughts!" />
                                )}

                                {/* Infinite scroll trigger */}
                                <div ref={ref} className="h-4" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default CommentsContainer;