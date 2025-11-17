/*
 * NEW FILE
 * Path: src/components/readit/ReaditCommentCard.jsx
 */
import React, { useState } from 'react';
import { getDay } from '../../common/date';
import { useCommentReplies } from '../../hooks/useReaditApi';
import VoteButtons from './VoteButtons';
import Loader from '../loader.component';
import { Link } from 'react-router-dom';

// Import the reusable field from its parent
const ReaditCommentField = ({ postId, parentId = null, onCommentPosted }) => {
     // (This is a simplified version. Ideally, this would be its own component file)
    const { useCreateReaditComment } = require('../../hooks/useReaditApi');
    const [comment, setComment] = useState("");
    const { mutate: postComment, isLoading } = useCreateReaditComment();

    const handleSubmit = () => {
        postComment({ postId, content: comment, parent: parentId }, {
            onSuccess: () => {
                setComment(""); 
                if(onCommentPosted) onCommentPosted();
            }
        });
    };

    return (
        <div className="my-2">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a reply..." className="input-box h-20" />
            <div className="flex justify-end mt-1">
                <button onClick={() => onCommentPosted()} className="btn-light text-sm px-4 py-1 mr-2">Cancel</button>
                <button onClick={handleSubmit} disabled={isLoading} className="btn-dark text-sm px-4 py-1">
                    {isLoading ? "..." : "Reply"}
                </button>
            </div>
        </div>
    );
};


// The main Comment Card
const ReaditCommentCard = ({ comment, postId }) => {
    const { author, content, createdAt, _id, children = [] } = comment;
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    // This hook is disabled by default.
    const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useCommentReplies(_id);

    const handleToggleReplies = () => {
        if (!showReplies) {
            refetch(); // Fetch replies for the first time
        }
        setShowReplies(!showReplies);
    };

    return (
        <div className="flex mb-4">
            <VoteButtons item={comment} isComment={true} />
            
            <div className="p-3 rounded-md w-full">
                <p className="text-xs text-dark-grey">
                    <Link to={`/user/${author.personal_info.username}`} className="hover:underline font-medium">
                        {author.personal_info.username}
                    </Link>
                    <span className="mx-2">•</span>
                    {getDay(createdAt)}
                </p>
                <p className="text-sm mt-1 text-black dark:text-white">{content}</p>

                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => setIsReplying(!isReplying)} className="flex items-center text-dark-grey text-xs hover:text-blue">
                         <i className="fi fi-rr-comment-dots mr-1"></i> Reply
                    </button>
                </div>

                {isReplying && (
                    <ReaditCommentField 
                        postId={postId} 
                        parentId={_id} 
                        onCommentPosted={() => setIsReplying(false)} 
                    />
                )}

                {/* SCALABLE REPLIES (On-Demand) */}
                {children.length > 0 && (
                    <button onClick={handleToggleReplies} className="text-xs font-bold text-blue mt-2">
                        {showReplies ? 'Hide' : `View ${children.length} Replies`}
                    </button>
                )}

                {showReplies && (
                    <div className="ml-4 mt-2 pl-4 border-l-2 border-grey dark:border-grey-dark">
                        {isFetching && !data && <Loader />}
                        
                        {data?.pages.map((page, i) => (
                            <React.Fragment key={i}>
                                {page.replies.map(reply => (
                                    <ReaditCommentCard comment={reply} postId={postId} key={reply._id} />
                                ))}
                            </React.Fragment>
                        ))}
                        
                        {hasNextPage && (
                            <button onClick={() => fetchNextPage()} className="text-xs btn-light mt-2">
                                Load More Replies
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentCard;