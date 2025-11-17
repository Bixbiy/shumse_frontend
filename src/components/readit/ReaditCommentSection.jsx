/*
 * NEW FILE
 * Path: src/components/readit/ReaditCommentSection.jsx
 */
import React, { useState } from 'react';
import { usePostComments, useCreateReaditComment } from '../../hooks/useReaditApi';
import ReaditCommentCard from './ReaditCommentCard';
import Loader from '../loader.component';
import toast from 'react-hot-toast';

// A simple, reusable comment field
const ReaditCommentField = ({ postId, parentId = null, onCommentPosted }) => {
    const [comment, setComment] = useState("");
    const { mutate: postComment, isLoading } = useCreateReaditComment();

    const handleSubmit = () => {
        if (!comment.trim()) {
            return toast.error("Comment can't be empty");
        }
        postComment({ postId, content: comment, parent: parentId }, {
            onSuccess: () => {
                setComment(""); // Clear the box
                if(onCommentPosted) onCommentPosted();
            }
        });
    };

    return (
        <div className="my-4">
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
                className="input-box h-24"
            />
            <div className="flex justify-end mt-2">
                <button onClick={handleSubmit} disabled={isLoading} className="btn-dark px-6">
                    {isLoading ? "Posting..." : "Reply"}
                </button>
            </div>
        </div>
    );
};


// The main comment section component
const ReaditCommentSection = ({ post }) => {
    const [sort, setSort] = useState('top');
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePostComments(post._id, sort);

    return (
        <div id="comments" className="mt-6 bg-white dark:bg-grey-dark rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">{post.commentCount} Comments</h2>
            
            <ReaditCommentField postId={post._id} />

            {/* TODO: Add Sort (Top, New) buttons here */}

            <div className="mt-6">
                {isLoading && <Loader />}
                
                {data?.pages.map((page, i) => (
                    <React.Fragment key={i}>
                        {page.comments.map(comment => (
                            <ReaditCommentCard 
                                comment={comment} 
                                postId={post._id} 
                                key={comment._id} 
                            />
                        ))}
                    </React.Fragment>
                ))}

                {hasNextPage && (
                    <button 
                        onClick={() => fetchNextPage()} 
                        disabled={isFetchingNextPage}
                        className="btn-light w-full mt-4"
                    >
                        {isFetchingNextPage ? 'Loading...' : 'Load More Comments'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReaditCommentSection;