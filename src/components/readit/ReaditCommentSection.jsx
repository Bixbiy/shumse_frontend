/*
 * PATH: src/components/readit/ReaditCommentSection.jsx
 * Fixed animation values and auth issues
 */
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../common/api';
import ReaditCommentCard from './ReaditCommentCard';
import toast from 'react-hot-toast';
import { UserContext } from '../../App';
import { Link } from 'react-router-dom';
import { handleError } from '../../common/errorHandler';
import DOMPurify from 'dompurify';
import { useSocket } from '../../context/SocketContext';

// Enhanced Comment Field with FIXED animations
const ReaditMainCommentField = ({ postId, onCommentPosted }) => {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) return toast.error("Comment can't be empty");

        const sanitizedComment = DOMPurify.sanitize(comment.trim(), {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
            ALLOWED_ATTR: ['href']
        });

        if (!sanitizedComment) return toast.error("Invalid comment content");

        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/readit/posts/${postId}/comments`, { content: sanitizedComment });
            setComment("");
            toast.success("Comment posted!", { icon: '💬' });
            if (onCommentPosted) onCommentPosted();
        } catch (err) {
            handleError(err, "Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`mb-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-1 transition-all duration-300 ${isFocused
                    ? 'ring-2 ring-orange-500 ring-opacity-50'
                    : ''
                }`}
        >
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Share your thoughts..."
                className="w-full h-28 resize-none p-4 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="flex items-center justify-between p-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <span className="text-xs text-gray-400">
                    {comment.length}/1000
                </span>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !comment.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Posting...
                        </div>
                    ) : (
                        <>
                            <i className="fi fi-rr-paper-plane mr-2"></i>
                            Comment
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

// Comment Skeleton
const CommentSkeleton = () => (
    <div className="animate-pulse space-y-4">
        {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

// Main Section
const ReaditCommentSection = ({ post, onCommentPosted }) => {
    const { userAuth } = useContext(UserContext);
    const { socket } = useSocket();
    const [sort, setSort] = useState('top');
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const page = useRef(1);
    const hasMore = useRef(true);

    const fetchComments = useCallback(async (isReset = false) => {
        if (isReset) {
            page.current = 1;
            hasMore.current = true;
            setComments([]);
        }

        setIsLoading(true);
        try {
            const { data } = await axiosInstance.get(`/readit/posts/${post._id}/comments?sort=${sort}&page=${page.current}&limit=10`);

            if (isReset) {
                setComments(data.comments || []);
            } else {
                setComments(prev => [...prev, ...(data.comments || [])]);
            }

            page.current += 1;
            hasMore.current = data.hasMore;
        } catch (err) {
            handleError(err, "Failed to load comments");
        } finally {
            setIsLoading(false);
        }
    }, [post._id, sort]);

    // Initial Fetch
    useEffect(() => {
        fetchComments(true);
    }, [fetchComments]);

    // Real-time comment updates
    useEffect(() => {
        if (!socket || !post._id) return;

        const handleNewComment = (comment) => {
            if (comment.post === post._id) {
                setComments(prev => {
                    if (prev.find(c => c._id === comment._id)) return prev;
                    return [{ ...comment, isNew: true }, ...prev];
                });
            }
        };

        const handleCommentUpdate = (updated) => {
            setComments(prev => prev.map(c =>
                c._id === updated._id ? { ...c, ...updated } : c
            ));
        };

        socket.on('newComment', handleNewComment);
        socket.on('commentUpdated', handleCommentUpdate);

        return () => {
            socket.off('newComment', handleNewComment);
            socket.off('commentUpdated', handleCommentUpdate);
        };
    }, [socket, post._id]);

    const fetchMoreComments = async () => {
        if (isFetchingMore || !hasMore.current) return;

        setIsFetchingMore(true);
        try {
            const { data } = await axiosInstance.get(`/readit/posts/${post._id}/comments?sort=${sort}&page=${page.current}&limit=10`);
            setComments(prev => [...prev, ...(data.comments || [])]);
            page.current += 1;
            hasMore.current = data.hasMore;
        } catch (err) {
            handleError(err, "Failed to fetch more comments");
        } finally {
            setIsFetchingMore(false);
        }
    };

    const handleCommentPosted = () => {
        fetchComments(true);
        if (onCommentPosted) onCommentPosted();
    };

    const sortOptions = [
        { key: 'top', label: 'Top', icon: 'fi-rr-trophy' },
        { key: 'new', label: 'New', icon: 'fi-rr-sparkles' }
    ];

    return (
        <div id="comments">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fi fi-rr-comment-alt text-orange-500"></i>
                    {post.commentCount || 0} Comments
                </h2>
                <div className="flex gap-2">
                    {sortOptions.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setSort(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${sort === key
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <i className={`fi ${icon}`}></i>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment Input */}
            {userAuth?.access_token ? (
                <ReaditMainCommentField postId={post._id} onCommentPosted={handleCommentPosted} />
            ) : (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl text-center mb-6 border border-orange-200/50 dark:border-orange-800/50">
                    <i className="fi fi-rr-comment-alt text-3xl text-orange-500 mb-3 block"></i>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">Join the conversation</p>
                    <Link
                        to="/signin"
                        className="inline-block px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
                    >
                        Sign In
                    </Link>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {isLoading && page.current === 1 ? (
                    <CommentSkeleton />
                ) : comments.length > 0 ? (
                    <AnimatePresence>
                        {comments.map((comment, index) => (
                            <motion.div
                                key={comment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ReaditCommentCard
                                    comment={comment}
                                    postId={post._id}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <i className="fi fi-rr-comment-alt text-2xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No comments yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share your thoughts!</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore.current && !isLoading && (
                    <button
                        onClick={fetchMoreComments}
                        disabled={isFetchingMore}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {isFetchingMore ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                            </div>
                        ) : (
                            'Load More Comments'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentSection;