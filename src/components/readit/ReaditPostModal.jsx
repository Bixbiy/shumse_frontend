import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserContext } from '../../App';
import { useSocket } from '../../context/SocketContext';
import { apiGetReaditComments, apiCreateReaditComment, apiVoteReaditPost, apiVoteReaditComment } from '../../common/api';
import { getDay } from '../../common/date';
import VoteButtons from './VoteButtons';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader'; // Corrected import path
import AIAgentModal from './AiAgentModal';
import DOMPurify from 'dompurify';

// --- Re-usable Comment Form ---
const CreateCommentForm = ({ postId, parentId = null, onCommentCreated, autoFocus = false, postContext }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userAuth } = useContext(UserContext);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // SANITIZATION FIX
        const sanitizedContent = DOMPurify.sanitize(content.trim(), {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
            ALLOWED_ATTR: ['href']
        });

        if (!sanitizedContent) return;

        setIsSubmitting(true);

        try {
            const { data: newComment } = await apiCreateReaditComment(postId, {
                content: sanitizedContent,
                parent: parentId,
            });
            toast.success('Comment posted!');
            setContent('');
            onCommentCreated(newComment);
        } catch (err) {
            toast.error('Failed to post comment.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAiGenerate = (generatedText) => {
        setContent(generatedText);
        setIsAiModalOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex items-start space-x-3 mt-4">
                <img
                    src={userAuth?.profile_img}
                    className="w-9 h-9 rounded-full"
                    alt="Your avatar"
                />
                <div className="flex-1">
                    <textarea
                        className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={parentId ? "Write a reply..." : "Add a comment..."}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={2}
                        autoFocus={autoFocus}
                        required
                    ></textarea>
                    <div className="flex justify-between items-center mt-2">
                        <button
                            type="button"
                            onClick={() => setIsAiModalOpen(true)}
                            className="btn-light text-sm flex items-center gap-2"
                            title="Generate reply with AI"
                        >
                            <i className="fi fi-rr-sparkles text-blue-500"></i>
                            <span className="hidden sm:inline">AI Reply</span>
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="btn-dark text-sm flex items-center disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader /> : <i className="fi fi-rr-paper-plane mr-2"></i>}
                            {parentId ? 'Reply' : 'Comment'}
                        </button>
                    </div>
                </div>
            </form>
            {isAiModalOpen && (
                <AIAgentModal
                    mode="comment"
                    postContext={postContext}
                    onClose={() => setIsAiModalOpen(false)}
                    onGenerate={handleAiGenerate}
                />
            )}
        </>
    );
};

// --- Re-usable Comment Component ---
const Comment = ({ comment, onReply, onVote, postContext }) => {
    const [isReplying, setIsReplying] = useState(false);
    const authorInfo = comment.author?.personal_info;

    if (!authorInfo) {
        return (
            <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-grey">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-grey"></div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">[Comment deleted]</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-grey">
            <img src={authorInfo.profile_img} className="w-8 h-8 rounded-full" alt="author" />
            <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Link to={`/user/${authorInfo.username}`} className="font-semibold text-dark-grey dark:text-light-grey hover:underline">
                        {authorInfo.username}
                    </Link>
                    <span>·</span>
                    <span>{getDay(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-dark-grey dark:text-white mt-1 mb-2 whitespace-pre-wrap">
                    {comment.content}
                </p>
                <div className="flex items-center space-x-4">
                    <VoteButtons item={comment} onVote={onVote} isComment={true} />
                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium hover:text-blue-500"
                    >
                        <i className="fi fi-rr-comment-dots mr-1.5"></i>
                        Reply
                    </button>
                </div>

                <AnimatePresence>
                    {isReplying && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-3"
                        >
                            <CreateCommentForm
                                postId={comment.post}
                                parentId={comment._id}
                                onCommentCreated={(newReply) => {
                                    onReply(newReply);
                                    setIsReplying(false);
                                }}
                                autoFocus={true}
                                postContext={postContext}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-4 pl-4 border-l-2 border-gray-100 dark:border-grey">
                    {comment.children &&
                        comment.children.map((reply) => (
                            <Comment key={reply._id} comment={reply} onReply={onReply} onVote={onVote} postContext={postContext} />
                        ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Modal Component ---
const ReaditPostModal = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localPost, setLocalPost] = useState(post);
    const { socket } = useSocket(); // Use corrected hook
    const modalRef = useRef(null);

    // ACCESSIBILITY: Focus Trap & ESC Key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        setLocalPost(post);
    }, [post]);

    useEffect(() => {
        if (post?._id) {
            setIsLoading(true);
            apiGetReaditComments(post._id)
                .then(({ data }) => setComments(data))
                .catch(err => {
                    console.error(err);
                    toast.error('Failed to load comments.');
                })
                .finally(() => setIsLoading(false));
        }
    }, [post?._id]);

    // Socket Listeners
    useEffect(() => {
        if (socket && post?._id) {
            const newCommentHandler = (newComment) => {
                if (newComment.post !== post._id) return;
                setComments(prevComments => {
                    if (newComment.parent) {
                        const addReply = (comments) => comments.map(c =>
                            c._id === newComment.parent
                                ? { ...c, children: [...(c.children || []), newComment] }
                                : { ...c, children: addReply(c.children || []) }
                        );
                        return addReply(prevComments);
                    }
                    return [...prevComments, newComment];
                });
                setLocalPost(prev => ({ ...prev, commentCount: prev.commentCount + 1 }));
            };

            const commentVoteHandler = ({ commentId, votes, upvotedBy, downvotedBy }) => {
                const updateVote = (comments) => comments.map(c =>
                    c._id === commentId
                        ? { ...c, votes, upvotedBy, downvotedBy }
                        : { ...c, children: updateVote(c.children || []) }
                );
                setComments(prev => updateVote(prev));
            };

            const postVoteHandler = ({ postId, votes, upvotedBy, downvotedBy }) => {
                if (postId === post._id) {
                    setLocalPost(prev => ({ ...prev, votes, upvotedBy, downvotedBy }));
                }
            };

            socket.on('newReaditComment', newCommentHandler);
            socket.on('readitCommentVoted', commentVoteHandler);
            socket.on('readitPostVoted', postVoteHandler);

            return () => {
                socket.off('newReaditComment', newCommentHandler);
                socket.off('readitCommentVoted', commentVoteHandler);
                socket.off('readitPostVoted', postVoteHandler);
            };
        }
    }, [socket, post?._id]);

    const handleCommentCreated = useCallback((newComment) => {
        setComments(prevComments => {
            if (newComment.parent) {
                const addReply = (comments) => comments.map(c =>
                    c._id === newComment.parent
                        ? { ...c, children: [...(c.children || []), newComment] }
                        : { ...c, children: addReply(c.children || []) }
                );
                return addReply(prevComments);
            }
            return [...prevComments, newComment];
        });
        setLocalPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
    }, []);

    const handleVotePost = (postId, voteType) => apiVoteReaditPost(postId, voteType);
    const handleVoteComment = (commentId, voteType) => apiVoteReaditComment(commentId, voteType);

    const postContext = { title: localPost?.title, content: localPost?.content };

    return (
        <AnimatePresence>
            {localPost && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-start p-4 overflow-y-auto"
                    onClick={onClose}
                    role="presentation"
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white dark:bg-dark-grey-2 rounded-lg shadow-xl w-full max-w-3xl my-10"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-grey">
                            <h2 id="modal-title" className="text-lg font-semibold text-dark-grey dark:text-white line-clamp-1">
                                {localPost.title}
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-grey">
                                <i className="fi fi-rr-cross text-sm"></i>
                            </button>
                        </div>

                        {/* Post Content */}
                        <div className="p-4 max-h-[75vh] overflow-y-auto">
                            <div className="flex">
                                <VoteButtons item={localPost} onVote={handleVotePost} />
                                <div className="pl-4 flex-grow w-full overflow-hidden">
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        <Link to={`/user/${localPost.author.personal_info.username}`} className="flex items-center hover:underline">
                                            <img src={localPost.author.personal_info.profile_img} className="w-5 h-5 rounded-full mr-2" alt="author" />
                                            <span className="font-semibold text-dark-grey dark:text-light-grey">{localPost.author.personal_info.username}</span>
                                        </Link>
                                        <span className="mx-1.5">·</span>
                                        <i className="fi fi-rr-clock text-xs mr-1"></i>
                                        <span>{getDay(localPost.createdAt)}</span>
                                    </div>
                                    {localPost.content && (
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2">
                                            {localPost.content}
                                        </p>
                                    )}
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                                        <i className="fi fi-rr-comment-dots mr-1.5"></i>
                                        <span>{localPost.commentCount} Comment{localPost.commentCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            <CreateCommentForm
                                postId={localPost._id}
                                onCommentCreated={handleCommentCreated}
                                postContext={postContext}
                            />

                            <div className="mt-6">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-20"><Loader /></div>
                                ) : comments.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">Be the first to comment!</p>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <Comment
                                                key={comment._id}
                                                comment={comment}
                                                onReply={handleCommentCreated}
                                                onVote={handleVoteComment}
                                                postContext={postContext}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReaditPostModal;