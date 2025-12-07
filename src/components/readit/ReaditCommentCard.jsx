import React, { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { getDay } from '../../common/date';
import axiosInstance from '../../common/api';
import { UserContext } from '../../App';
import toast from 'react-hot-toast';

import { handleError } from '../../common/errorHandler';
import { MAX_COMMENT_DEPTH } from './constants';
import DOMPurify from 'dompurify';
import VerificationBadge from '../VerificationBadge';

const ReaditCommentCard = ({ comment, postId, depth = 0 }) => {
    const { userAuth } = useContext(UserContext);
    // Backend uses 'children' to store the count of replies. Alias it to replyCount for clarity.
    const { author, content, createdAt, _id, children: replyCount = 0, userVote, score } = comment;

    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    // Reply Logic
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState([]);
    const [areRepliesLoaded, setAreRepliesLoaded] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);

    const canNest = depth < MAX_COMMENT_DEPTH;

    const handleToggleReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setShowReplies(true);

        if (!areRepliesLoaded && replyCount > 0) {
            setIsLoadingReplies(true);
            try {
                // Using axiosInstance directly as per existing pattern, 
                // but aligned with user's request logic
                const { data } = await axiosInstance.get(`/readit/comments/${_id}/replies?limit=50`);
                setReplies(data.replies);
                setAreRepliesLoaded(true);
            } catch (error) {
                handleError(error, "Failed to load replies");
                setShowReplies(false); // Hide if failed
            } finally {
                setIsLoadingReplies(false);
            }
        }
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return;

        // Sanitize reply content
        const sanitizedContent = DOMPurify.sanitize(replyContent.trim(), {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
            ALLOWED_ATTR: ['href']
        });

        if (!sanitizedContent) return toast.error("Invalid reply content");

        try {
            const { data } = await axiosInstance.post(`/readit/posts/${postId}/comments`, {
                content: sanitizedContent,
                parent: _id
            });

            // Add new reply to local state
            setReplies(prev => [data, ...prev]);

            // If replies weren't loaded, mark them as loaded so we don't overwrite the new reply with a fetch
            if (!areRepliesLoaded) setAreRepliesLoaded(true);

            setReplyContent("");
            setIsReplying(false);
            setShowReplies(true); // Auto-open to show new reply
            toast.success("Reply posted!");
        } catch (err) {
            handleError(err, "Failed to reply");
        }
    };

    return (
        <div className={`flex gap-2 ${depth > 0 ? 'mt-3' : 'mt-4'}`}>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-600">
                    <img
                        src={author?.personal_info?.profile_img}
                        alt={`${author?.personal_info?.username || 'User'} avatar`}
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Thread line */}
                {canNest && (replyCount > 0 || replies.length > 0) && showReplies && (
                    <div className="w-0.5 flex-grow bg-gray-200 dark:bg-gray-700 my-2 rounded-full cursor-pointer hover:bg-orange-400 transition-colors" onClick={() => setShowReplies(false)} title="Collapse thread"></div>
                )}
            </div>

            <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Link to={`/user/${author?.personal_info?.username}`} className="font-bold text-black dark:text-white hover:underline truncate flex items-center gap-1">
                        {author?.personal_info?.username || '[deleted]'}
                        {author?.personal_info?.isVerified && <VerificationBadge size={12} />}
                    </Link>
                    <span>•</span>
                    <span>{getDay(createdAt)}</span>
                </div>

                <div className="text-sm text-gray-900 dark:text-gray-200 mb-2 whitespace-pre-wrap break-words">{content}</div>

                <div className="flex items-center gap-4 flex-wrap select-none">
                    <VoteButtons item={comment} isComment={true} orientation="horizontal" size="sm" />

                    {userAuth?.access_token && canNest && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <i className="fi fi-rr-comment"></i> Reply
                        </button>
                    )}

                    {/* View/Hide Replies Button */}
                    {canNest && replyCount > 0 && (
                        <button
                            onClick={handleToggleReplies}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            {isLoadingReplies ? (
                                <><i className="fi fi-rr-spinner animate-spin"></i> Loading...</>
                            ) : showReplies ? (
                                <><i className="fi fi-rr-angle-small-up"></i> Hide Replies</>
                            ) : (
                                <><i className="fi fi-rr-angle-small-down"></i> View {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}</>
                            )}
                        </button>
                    )}
                </div>

                {isReplying && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 ml-2"
                    >
                        <textarea
                            className="input-box text-sm p-3 h-24 w-full rounded-xl bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 transition-colors"
                            placeholder="What are your thoughts?"
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            maxLength={10000}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsReplying(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={handleReplySubmit} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition-opacity">Reply</button>
                        </div>
                    </motion.div>
                )}

                {/* Nested Replies */}
                {showReplies && (
                    <div className="mt-2 space-y-3">
                        {replies.map(reply => (
                            <ReaditCommentCard
                                key={reply._id}
                                comment={reply}
                                postId={postId}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentCard;