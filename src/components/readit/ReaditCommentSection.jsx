/*
 * PATH: src/components/readit/ReaditCommentSection.jsx
 */
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axiosInstance from '../../common/api';
import ReaditCommentCard from './ReaditCommentCard';
import Loader from '../Loader';
import toast from 'react-hot-toast';
import { UserContext } from '../../App';
import { handleError } from '../../common/errorHandler';

// --- INLINE MAIN COMMENT FIELD ---
const ReaditMainCommentField = ({ postId, onCommentPosted }) => {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) return toast.error("Comment can't be empty");

        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/readit/posts/${postId}/comments`, { content: comment });
            setComment("");
            if (onCommentPosted) onCommentPosted();
        } catch (err) {
            handleError(err, "Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mb-6">
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What are your thoughts?"
                className="input-box h-28 resize-none p-4"
            />
            <div className="flex justify-end mt-2">
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-dark px-6 py-2">
                    {isSubmitting ? "Posting..." : "Comment"}
                </button>
            </div>
        </div>
    );
};

// --- MAIN SECTION ---
const ReaditCommentSection = ({ post, onCommentPosted }) => {
    const { userAuth } = useContext(UserContext);
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

            page.current += 1; // Prepare for next page
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
        fetchComments(true); // Refresh list
        if (onCommentPosted) onCommentPosted(); // Update parent post counts
    };

    return (
        <div id="comments" className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">
                    {post.commentCount} Comments
                </h2>
                <div className="flex gap-2">
                    <button onClick={() => setSort('top')} className={`text-xs px-3 py-1 rounded-full ${sort === 'top' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>Top</button>
                    <button onClick={() => setSort('new')} className={`text-xs px-3 py-1 rounded-full ${sort === 'new' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>New</button>
                </div>
            </div>

            {userAuth.access_token ? (
                <ReaditMainCommentField postId={post._id} onCommentPosted={handleCommentPosted} />
            ) : (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Log in to join the discussion</p>
                </div>
            )}

            <div className="space-y-4">
                {isLoading && page.current === 1 ? (
                    <Loader />
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <ReaditCommentCard
                            comment={comment}
                            postId={post._id}
                            key={comment._id}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                )}

                {hasMore.current && !isLoading && (
                    <button
                        onClick={fetchMoreComments}
                        disabled={isFetchingMore}
                        className="w-full py-2 text-sm font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {isFetchingMore ? 'Loading...' : 'Load More Comments'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentSection;