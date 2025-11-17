import React from 'react';
import { Link } from 'react-router-dom';
import { getDay } from '../../common/date';
import VoteButtons from './VoteButtons';
import { apiVoteReaditPost } from '../../common/api';

const ReaditPostCard = ({ post, onClick }) => {
    
    // Wrapper function for API call
    const handleVote = (postId, voteType) => {
        return apiVoteReaditPost(postId, voteType);
    };

    return (
        <div className="flex bg-white dark:bg-dark-grey border border-gray-200 dark:border-grey rounded-lg shadow-sm mb-4 overflow-hidden">
            {/* Vote Section */}
            <VoteButtons
                item={post}
                onVote={handleVote}
                orientation="vertical"
            />
            
            {/* Content Section */}
            <div
                className="flex-1 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-grey-2 transition-colors"
                onClick={() => onClick(post)}
            >
                {/* Post Info */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Link
                        to={`/user/${post.author.personal_info.username}`}
                        className="flex items-center hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent modal from opening
                    >
                        <img src={post.author.personal_info.profile_img} className="w-5 h-5 rounded-full mr-2" alt="author" />
                        <span className="font-semibold text-dark-grey dark:text-light-grey">{post.author.personal_info.username}</span>
                    </Link>
                    <span className="mx-1.5">·</span>
                    <i className="fi fi-rr-clock text-xs mr-1"></i>
                    <span>{getDay(post.createdAt)}</span>
                </div>
                
                {/* Post Body */}
                <h2 className="text-lg font-semibold text-dark-grey dark:text-white mb-1 line-clamp-2">
                    {post.title}
                </h2>
                {post.content && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {post.content}
                    </p>
                )}
                
                {/* Footer Actions */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                    <i className="fi fi-rr-comment-dots mr-1.5"></i>
                    <span>{post.commentCount} Comment{post.commentCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    );
};

export default ReaditPostCard;