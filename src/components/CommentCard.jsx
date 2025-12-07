import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserContext } from '../App';
import api from '../common/api';
import CommentField from './CommentField';
import { formatDate } from '../common/date';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { useSocket } from '../context/SocketContext';
import VerificationBadge from './VerificationBadge';

// Optimized icons - using simple SVG icons
const Icons = {
    Heart: ({ filled = false, className = "w-4 h-4" }) => (
        <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={filled
                    ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                }
            />
        </svg>
    ),
    Reply: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    ),
    More: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
    ),
    Edit: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    Delete: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    ChevronDown: ({ className = "w-3 h-3" }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    ),
    ChevronUp: ({ className = "w-3 h-3" }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
    ),
    Loading: ({ className = "w-4 h-4" }) => (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
};

// Custom hook for click outside
const useClickOutside = (ref, callback) => {
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, callback]);
};

const CommentCard = React.memo(({ commentData, depth = 0 }) => {
    // State with minimal re-renders
    const [cardData, setCardData] = useState(commentData);
    const [isLiked, setIsLiked] = useState(commentData.isLiked);
    const [likesCount, setLikesCount] = useState(commentData.upvotesCount);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [inlineReplies, setInlineReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [allRepliesLoaded, setAllRepliesLoaded] = useState(false);
    const [repliesPage, setRepliesPage] = useState(0);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    const actionsMenuRef = useRef(null);
    useClickOutside(actionsMenuRef, () => setShowActionsMenu(false));

    // Context and props
    const { _id, blog_id, blog_author, comment, commentedAt, commented_by, isDeleted, repliesCount, edited } = cardData;
    const { personal_info: { fullname, profile_img, username, isVerified } = {} } = commented_by || {};

    const { userAuth } = useContext(UserContext);
    const { access_token, _id: currentUserId } = userAuth || {};
    const { socket } = useSocket();

    // Memoized values for performance
    const isCommentAuthor = useMemo(() => currentUserId === commented_by?._id, [currentUserId, commented_by?._id]);
    const isBlogAuthor = useMemo(() => currentUserId === blog_author, [currentUserId, blog_author]);
    const canModify = useMemo(() => isCommentAuthor || isBlogAuthor, [isCommentAuthor, isBlogAuthor]);

    const repliesLimit = 5;
    const maxDepth = 5;

    // Optimized socket listeners
    useEffect(() => {
        if (!socket || !_id) return;

        const handlers = {
            commentLiked: (likeData) => {
                if (likeData._id === _id) {
                    setLikesCount(likeData.upvotesCount);
                    if (likeData.userId === currentUserId) {
                        setIsLiked(likeData.isLiked);
                    }
                }
            },
            commentUpdated: (updatedData) => {
                if (updatedData._id === _id) {
                    setCardData(prev => ({
                        ...prev,
                        comment: updatedData.comment,
                        edited: updatedData.edited,
                        editedAt: updatedData.editedAt
                    }));
                }
            },
            newReply: (newReply) => {
                if (newReply.parent === _id && showReplies) {
                    setInlineReplies(prev => [newReply, ...prev]);
                }
                if (newReply.parent === _id) {
                    setCardData(prev => ({
                        ...prev,
                        repliesCount: (prev.repliesCount || 0) + 1
                    }));
                }
            },
            commentDeleted: (deletedData) => {
                if (deletedData._id === _id) {
                    setCardData(prev => ({
                        ...prev,
                        isDeleted: true,
                        comment: '[deleted]',
                        commented_by: null
                    }));
                }
            }
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        return () => {
            Object.entries(handlers).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    }, [socket, _id, currentUserId, showReplies]);

    // Memoized action handlers
    const handleReplyToggle = useCallback(() => {
        if (!access_token) {
            toast.error("Please login to reply");
            return;
        }
        setShowReplyInput(prev => !prev);
    }, [access_token]);

    const postReply = useCallback(async (replyText) => {
        if (!access_token) {
            toast.error("Please login to reply");
            return;
        }

        const tempReply = {
            _id: `temp-${Date.now()}`, blog_id, blog_author, comment: replyText,
            commented_by: { personal_info: { ...userAuth } },
            commentedAt: new Date().toISOString(), isReply: true, parent: _id,
            upvotes: [], upvotesCount: 0, isLiked: false
        };

        setInlineReplies(prev => [tempReply, ...prev]);
        setShowReplyInput(false);

        try {
            const { data: serverReply } = await api.post('/reply-comment', {
                blog_id, blog_author, comment: replyText, parent_comment_id: _id
            });
            setInlineReplies(prev => prev.map(reply => reply._id === tempReply._id ? serverReply : reply));
            toast.success('Reply posted!');
        } catch (err) {
            setInlineReplies(prev => prev.filter(reply => !reply._id.startsWith('temp-')));
            toast.error(err.response?.data?.error || 'Failed to post reply');
        }
    }, [_id, access_token, blog_id, blog_author, userAuth]);

    const loadMoreReplies = useCallback(async () => {
        if (repliesLoading) return;
        setRepliesLoading(true);
        try {
            const { data } = await api.get(`/get-comment-replies/${_id}`, {
                params: { skip: repliesPage * repliesLimit, limit: repliesLimit, user_id: currentUserId }
            });
            if (data.length < repliesLimit) setAllRepliesLoaded(true);
            setInlineReplies(prev => [...prev, ...data]);
            setRepliesPage(prev => prev + 1);
        } catch (err) {
            toast.error('Failed to load replies.');
        } finally {
            setRepliesLoading(false);
        }
    }, [_id, repliesPage, currentUserId, repliesLoading, repliesLimit]);

    const toggleReplies = useCallback(() => {
        if (!showReplies && inlineReplies.length === 0 && repliesCount > 0) {
            loadMoreReplies();
        }
        setShowReplies(prev => !prev);
    }, [showReplies, inlineReplies.length, repliesCount, loadMoreReplies]);

    const handleLike = useCallback(async () => {
        if (!access_token) {
            toast.error("Please login to like");
            return;
        }
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await api.post(`/like-comment`, { comment_id: _id });
        } catch (err) {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
            toast.error('Like failed. Please try again.');
        }
    }, [_id, access_token, isLiked]);

    const handleEditSubmit = useCallback(async (editedComment) => {
        if (!access_token) {
            toast.error("Please login to edit");
            return;
        }
        try {
            await api.patch(`/edit-comment/${_id}`, { comment: editedComment });
            setIsEditing(false);
            toast.success("Comment updated!");
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to edit');
            throw err;
        }
    }, [_id, access_token]);

    const handleDelete = useCallback(async () => {
        if (!access_token) {
            toast.error("Please login to delete");
            return;
        }
        setShowActionsMenu(false);
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        const toastId = toast.loading("Deleting...");
        try {
            await api.delete(`/delete-comment/${_id}`);
            toast.success("Comment deleted", { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete', { id: toastId });
        }
    }, [_id, access_token]);

    // Early returns for edge cases
    if (depth > maxDepth) return null;

    if (isDeleted) {
        return (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                    <Icons.Delete className="w-4 h-4" />
                    This comment has been deleted
                </div>
            </div>
        );
    }

    return (
        <div className={`mb-3 ${depth > 0 ? 'ml-3 pl-3 border-l border-gray-200 dark:border-gray-600' : ''}`}>
            <div className="flex items-start gap-3">
                {/* Optimized avatar */}
                <div className="flex-shrink-0">
                    <img
                        src={profile_img || '/default-avatar.png'}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            e.target.src = '/default-avatar.png';
                            e.target.onerror = null;
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <CommentField
                            action="Save"
                            initialText={comment}
                            onPost={handleEditSubmit}
                            onCancel={() => setIsEditing(false)}
                            autoFocus
                        />
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                            {/* Header - optimized layout */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                            {fullname || 'Anonymous'}
                                            {isVerified && <VerificationBadge size={12} />}
                                        </span>
                                        {username && (
                                            <span className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                                @{username}
                                            </span>
                                        )}
                                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                                            {formatDate(commentedAt) || 'Just now'}
                                        </span>
                                        {edited && (
                                            <span className="text-blue-500 dark:text-blue-400 text-xs flex items-center gap-1">
                                                <Icons.Edit className="w-3 h-3" />
                                                edited
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {canModify && (
                                    <div className="relative" ref={actionsMenuRef}>
                                        <button
                                            onClick={() => setShowActionsMenu(prev => !prev)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            aria-label="Comment actions"
                                        >
                                            <Icons.More />
                                        </button>

                                        {showActionsMenu && (
                                            <div className="absolute top-full right-0 z-10 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1">
                                                {isCommentAuthor && (
                                                    <button
                                                        onClick={() => { setIsEditing(true); setShowActionsMenu(false); }}
                                                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    >
                                                        <Icons.Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-orange-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Icons.Delete className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Comment content */}
                            <p className="text-gray-800 dark:text-gray-200 text-sm mb-3 leading-relaxed">
                                {comment}
                            </p>

                            {/* Actions - optimized buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleLike}
                                    disabled={!access_token}
                                    className={`flex items-center gap-1 text-sm transition-colors ${isLiked
                                        ? 'text-orange-500'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-red-400'
                                        } ${!access_token ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Icons.Heart filled={isLiked} />
                                    <span>{likesCount || 0}</span>
                                </button>

                                <button
                                    onClick={handleReplyToggle}
                                    disabled={!access_token}
                                    className={`flex items-center gap-1 text-sm transition-colors ${!access_token
                                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                                        }`}
                                >
                                    <Icons.Reply />
                                    <span>Reply</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reply input */}
                    {showReplyInput && (
                        <div className="mt-3">
                            <CommentField
                                action="Reply"
                                replyingTo={_id}
                                onPost={postReply}
                                autoFocus
                                onCancel={() => setShowReplyInput(false)}
                            />
                        </div>
                    )}

                    {/* Replies section */}
                    {repliesCount > 0 && (
                        <div className="mt-3">
                            {!showReplies ? (
                                <button
                                    onClick={toggleReplies}
                                    className="flex items-center gap-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                    <Icons.ChevronDown />
                                    {`View ${repliesCount} ${repliesCount > 1 ? 'replies' : 'reply'}`}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleReplies}
                                        className="flex items-center gap-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium mb-2"
                                    >
                                        <Icons.ChevronUp />
                                        Hide replies
                                    </button>

                                    <div className="space-y-3">
                                        {inlineReplies.map(reply => (
                                            <CommentCard
                                                key={reply._id}
                                                commentData={reply}
                                                depth={depth + 1}
                                            />
                                        ))}
                                    </div>

                                    {!allRepliesLoaded && repliesCount > inlineReplies.length && (
                                        <button
                                            onClick={loadMoreReplies}
                                            disabled={repliesLoading}
                                            className={`flex items-center gap-2 mt-2 text-sm ${repliesLoading
                                                ? 'text-gray-400'
                                                : 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                                                }`}
                                        >
                                            {repliesLoading ? (
                                                <>
                                                    <Icons.Loading />
                                                    Loading...
                                                </>
                                            ) : (
                                                `Load ${repliesCount - inlineReplies.length} more`
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

CommentCard.propTypes = {
    commentData: PropTypes.object.isRequired,
    depth: PropTypes.number
};

CommentCard.displayName = 'CommentCard';

export default CommentCard;