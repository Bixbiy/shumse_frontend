import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { getDay } from '../../common/date';
import axiosInstance from '../../common/api';
import { UserContext } from '../../App';
import toast from 'react-hot-toast';
import { useContext } from 'react';
import { handleError } from '../../common/errorHandler';

const ReaditCommentCard = ({ comment, postId }) => {
    const { userAuth } = useContext(UserContext);
    const { author, content, createdAt, _id, children: childCount = 0 } = comment;

    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    // Reply Fetching Logic
    const [replies, setReplies] = useState([]);
    const [areRepliesLoaded, setAreRepliesLoaded] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const loadReplies = async () => {
        if (areRepliesLoaded) return;
        setLoadingReplies(true);
        try {
            // Fetch all replies for this parent
            const { data } = await axiosInstance.get(`/readit/comments/${_id}/replies?limit=50`);
            setReplies(data.replies);
            setAreRepliesLoaded(true);
        } catch (error) {
            handleError(error, "Failed to load replies");
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return;
        try {
            await axiosInstance.post(`/readit/posts/${postId}/comments`, {
                content: replyContent,
                parent: _id
            });
            setReplyContent("");
            setIsReplying(false);
            setAreRepliesLoaded(false); // Force reload to see new comment
            loadReplies();
        } catch (err) {
            handleError(err, "Failed to reply");
        }
    };

    return (
        <div className="flex gap-2 mt-4">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <img src={author?.personal_info?.profile_img} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Thread line */}
                <div className="w-0.5 flex-grow bg-gray-200 dark:bg-gray-700 my-2 group-hover:bg-gray-300"></div>
            </div>

            <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Link to={`/user/${author?.personal_info?.username}`} className="font-bold text-black dark:text-white hover:underline">
                        {author?.personal_info?.username}
                    </Link>
                    <span>•</span>
                    <span>{getDay(createdAt)}</span>
                </div>

                <div className="text-sm text-gray-900 dark:text-gray-200 mb-2 whitespace-pre-wrap">{content}</div>

                <div className="flex items-center gap-4">
                    <VoteButtons item={comment} isComment={true} />

                    {userAuth?.access_token && (
                        <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
                            <i className="fi fi-rr-comment"></i> Reply
                        </button>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-3 ml-2">
                        <textarea
                            className="input-box text-sm p-2 h-20"
                            placeholder="What are your thoughts?"
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsReplying(false)} className="btn-light py-1 px-3 text-xs">Cancel</button>
                            <button onClick={handleReplySubmit} className="btn-dark py-1 px-3 text-xs">Reply</button>
                        </div>
                    </div>
                )}

                {/* Load Replies Button */}
                {(childCount > 0 || replies.length > 0) && (
                    <div className="mt-2">
                        {!areRepliesLoaded && childCount > 0 ? (
                            <button onClick={loadReplies} className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">
                                {loadingReplies ? <i className="fi fi-rr-spinner animate-spin"></i> : <i className="fi fi-rr-plus-small"></i>}
                                {childCount} more replies
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {replies.map(reply => (
                                    <ReaditCommentCard key={reply._id} comment={reply} postId={postId} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentCard;