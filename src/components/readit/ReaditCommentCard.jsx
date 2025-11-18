/*
 * PATH: src/components/readit/ReaditCommentCard.jsx
 */
import React, { useState, useRef, useCallback, useContext } from 'react';
import { getDay } from '../../common/date';
import axiosInstance from '../../common/api';
import VoteButtons from './VoteButtons';
import Loader from '../loader.component';
import { Link } from 'react-router-dom';
import { userContext } from '../../App';
import toast from 'react-hot-toast';

// --- INLINE COMMENT FIELD (For Replies) ---
const ReaditCommentField = ({ postId, parentId = null, onCommentPosted, onCancel }) => {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            return toast.error("Comment can't be empty");
        }
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/readit/posts/${postId}/comments`, { 
                content: comment, 
                parent: parentId 
            });
            setComment("");
            if (onCommentPosted) {
                onCommentPosted(); 
            }
        } catch (err) {
            console.error("Failed to post reply:", err);
            toast.error(err.response?.data?.error || "Failed to post reply.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="my-2 ml-4">
            <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Write a reply..." 
                className="input-box h-20 text-sm" 
            />
            <div className="flex justify-end gap-2 mt-1">
                <button onClick={onCancel} className="btn-light text-sm px-3 py-1">Cancel</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-dark text-sm px-3 py-1">
                    {isSubmitting ? "..." : "Reply"}
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ReaditCommentCard = ({ comment, postId }) => {
    const { userAuth } = useContext(userContext);
    const { author, content, createdAt, _id, children = [] } = comment;
    
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    // Local State for Replies (Fetched on demand)
    const [replies, setReplies] = useState([]);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [isFetchingMoreReplies, setIsFetchingMoreReplies] = useState(false);
    
    const repliesPage = useRef(1);
    const hasMoreReplies = useRef(true);

    // --- FETCH LOGIC ---
    const fetchReplies = useCallback(async (isReset = false) => {
        if (isReset) {
            repliesPage.current = 1;
            hasMoreReplies.current = true;
            setReplies([]);
        }

        setIsLoadingReplies(true);
        try {
            const { data } = await axiosInstance.get(`/readit/comments/${_id}/replies?page=${repliesPage.current}&limit=5`);
            setReplies(data.replies || []);
            repliesPage.current = 2;
            hasMoreReplies.current = data.hasMore;
        } catch (err) {
            console.error("Failed to fetch replies:", err);
        } finally {
            setIsLoadingReplies(false);
        }
    }, [_id]);

    const fetchMoreReplies = async () => {
        if (isFetchingMoreReplies || !hasMoreReplies.current) return;

        setIsFetchingMoreReplies(true);
        try {
            const { data } = await axiosInstance.get(`/readit/comments/${_id}/replies?page=${repliesPage.current}&limit=5`);
            setReplies(prev => [...prev, ...(data.replies || [])]);
            repliesPage.current += 1;
            hasMoreReplies.current = data.hasMore;
        } catch (err) {
            console.error("Failed to fetch more replies:", err);
        } finally {
            setIsFetchingMoreReplies(false);
        }
    };

    const handleToggleReplies = () => {
        const newShowReplies = !showReplies;
        setShowReplies(newShowReplies);
        if (newShowReplies && replies.length === 0) {
            fetchReplies(true); // Fetch first batch
        }
    };

    const handleReplyPosted = () => {
        setIsReplying(false);
        fetchReplies(true); // Refetch to show new reply
        if (!showReplies) setShowReplies(true);
    };

    return (
        <div className="flex mb-4">
            <div className="flex-shrink-0 mr-2">
               <VoteButtons item={comment} isComment={true} />
            </div>
            
            <div className="p-3 bg-grey/10 dark:bg-grey/5 rounded-md w-full">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs text-dark-grey mb-1">
                    <Link to={`/user/${author?.personal_info?.username}`} className="hover:underline font-bold text-black dark:text-white">
                        {author?.personal_info?.username || "Unknown"}
                    </Link>
                    <span>•</span>
                    <span>{getDay(createdAt)}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-black dark:text-white whitespace-pre-wrap">{content}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                    {userAuth.access_token && (
                        <button onClick={() => setIsReplying(!isReplying)} className="flex items-center text-dark-grey text-xs hover:text-blue font-medium transition-colors">
                            <i className="fi fi-rr-comment-alt-dots mr-1"></i> Reply
                        </button>
                    )}
                </div>

                {/* Reply Input */}
                {isReplying && (
                    <ReaditCommentField 
                        postId={postId} 
                        parentId={_id} 
                        onCommentPosted={handleReplyPosted}
                        onCancel={() => setIsReplying(false)}
                    />
                )}

                {/* Replies Section */}
                {(children.length > 0 || replies.length > 0) && (
                    <div className="mt-2">
                        <button onClick={handleToggleReplies} className="text-xs font-bold text-blue hover:underline mb-2">
                            {showReplies ? 'Hide Replies' : `View ${children.length || replies.length} Replies`}
                        </button>

                        {showReplies && (
                            <div className="pl-3 border-l-2 border-grey dark:border-grey-dark ml-1 space-y-3">
                                {isLoadingReplies && <Loader />}
                                
                                {replies.map(reply => (
                                    <ReaditCommentCard comment={reply} postId={postId} key={reply._id} />
                                ))}
                                
                                {hasMoreReplies.current && !isLoadingReplies && (
                                    <button onClick={fetchMoreReplies} disabled={isFetchingMoreReplies} className="text-xs text-dark-grey hover:text-black dark:hover:text-white font-medium py-1">
                                        {isFetchingMoreReplies ? "Loading..." : "Load More Replies"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentCard;