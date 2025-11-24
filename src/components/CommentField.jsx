import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { postContext } from '../pages/blog.page';
import { UserContext } from '../App';
import PropTypes from 'prop-types';
import api from '../common/api';

const MAX_COMMENT_LENGTH = 250;

// Memoized icons to prevent re-renders
const Icons = {
    Send: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
    ),
    Loading: () => (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
};

const CommentField = React.memo(({ action, replyingTo = null, onPost, initialText = "", autoFocus = false, onCancel }) => {
    const [comment, setComment] = useState(initialText);
    const [isPosting, setIsPosting] = useState(false);
    const [charCount, setCharCount] = useState(initialText.length || 0);
    const [isFocused, setIsFocused] = useState(false);

    const { blog } = useContext(postContext) || {};
    const { userAuth } = useContext(UserContext);
    const { username, profile_img, fullname } = userAuth || {};
    const textareaRef = useRef(null);

    // Optimized effects
    useEffect(() => {
        setComment(initialText);
        setCharCount(initialText.length || 0);
    }, [initialText]);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    // Memoized handlers
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        if (value.length <= MAX_COMMENT_LENGTH) {
            setComment(value);
            setCharCount(value.length);
        }
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleComment();
        }
    }, [comment]);

    const handleComment = useCallback(async () => {
        if (!username) {
            toast.error(`Please login to ${action.toLowerCase()}`);
            return;
        }

        const sanitizedComment = DOMPurify.sanitize(comment.trim());
        if (!sanitizedComment) {
            toast.error(`Please write something to ${action.toLowerCase()}`);
            return;
        }

        setIsPosting(true);
        const toastId = toast.loading(`${action === 'Save' ? 'Saving' : 'Posting'}...`);

        try {
            if (action === "Save" || action === "Reply") {
                await onPost(sanitizedComment);
                setComment('');
                if (action === "Save" && onCancel) onCancel();
            } else if (action === "Comment") {
                if (!blog?._id) {
                    throw new Error("Blog data is not available.");
                }

                await api.post('/add-comment', {
                    blog_id: blog._id,
                    blog_author: blog.authorId._id,
                    comment: sanitizedComment,
                });

                setComment('');
                setCharCount(0);
            }

            toast.success(`${action}ed successfully!`, { id: toastId });

        } catch (err) {
            console.error(`Error posting ${action.toLowerCase()}:`, err);
            const errorMessage = err.response?.data?.error || err.code === 'ECONNABORTED'
                ? 'Request timeout.'
                : `Failed to ${action.toLowerCase()}`;

            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsPosting(false);
        }
    }, [action, blog, comment, onPost, onCancel, username]);

    const placeholderText = replyingTo
        ? 'Write your reply...'
        : action === "Save"
            ? 'Edit your comment...'
            : `Share your thoughts${username ? `, ${username.split(' ')[0]}` : ''}...`;

    return (
        <div className="mb-4">
            <div className="flex items-start gap-3">
                {/* Optimized avatar with lazy loading */}
                <div className="flex-shrink-0">
                    <img
                        src={profile_img || '/default-avatar.png'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            e.target.src = '/default-avatar.png';
                            e.target.onerror = null;
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`relative rounded-lg transition-colors duration-200 ${isFocused
                            ? 'bg-white dark:bg-gray-800 ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}>
                        <textarea
                            ref={textareaRef}
                            value={comment}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={placeholderText}
                            disabled={isPosting}
                            autoFocus={autoFocus}
                            className="w-full p-3 pr-20 bg-transparent border-0 rounded-lg resize-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-200 focus:outline-none text-sm leading-relaxed transition-colors"
                            rows="3"
                            maxLength={MAX_COMMENT_LENGTH}
                            aria-label={replyingTo ? 'Reply comment field' : 'Comment field'}
                        />

                        {/* Character counter - only show when near limit */}
                        {charCount > MAX_COMMENT_LENGTH * 0.7 && (
                            <div className="absolute right-3 top-3">
                                <div className={`text-xs font-medium px-2 py-1 rounded ${charCount > MAX_COMMENT_LENGTH * 0.9
                                        ? 'text-red-500 bg-red-500/10'
                                        : 'text-gray-500 bg-gray-500/10'
                                    }`}>
                                    {charCount}/{MAX_COMMENT_LENGTH}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    disabled={isPosting}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleComment}
                            disabled={isPosting || !comment.trim()}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isPosting || !comment.trim()
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow'
                                }`}
                        >
                            {isPosting ? (
                                <>
                                    <Icons.Loading />
                                    {action === 'Save' ? 'Saving...' : 'Posting...'}
                                </>
                            ) : (
                                <>
                                    {action === "Save" ? <Icons.Check /> : <Icons.Send />}
                                    {action}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CommentField.propTypes = {
    action: PropTypes.string.isRequired,
    replyingTo: PropTypes.string,
    onPost: PropTypes.func,
    initialText: PropTypes.string,
    autoFocus: PropTypes.bool,
    onCancel: PropTypes.func
};

CommentField.displayName = 'CommentField';

export default CommentField;