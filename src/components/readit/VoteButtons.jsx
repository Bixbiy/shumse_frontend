/*
 * MODIFIED FILE (Complete Replacement)
 * Path: src/components/readit/VoteButtons.jsx
 */
import React, { useContext } from 'react';
import { userContext } from '../../App';
import { useNavigate } from 'react-router-dom';
import { useVotePost, useVoteComment } from '../../hooks/useReaditApi';

const VoteButtons = ({ item, isComment = false }) => {
    // Add safety check for undefined item
    if (!item) {
        return (
            <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-black rounded-l-lg">
                <div className="text-2xl text-dark-grey p-1">
                    <i className="fi fi-rr-arrow-up"></i>
                </div>
                <span className="font-bold my-1 text-lg text-dark-grey">0</span>
                <div className="text-2xl text-dark-grey p-1">
                    <i className="fi fi-rr-arrow-down"></i>
                </div>
            </div>
        );
    }

    // Destructure with default values to prevent errors
    const { 
        _id = '', 
        upvotedBy = [], 
        downvotedBy = [], 
        votes = 0 
    } = item;

    const { userAuth } = useContext(userContext);
    const navigate = useNavigate();

    // USE THE NEW MUTATION HOOKS
    const { mutate: votePost, isLoading: isVotingPost } = useVotePost();
    const { mutate: voteComment, isLoading: isVotingComment } = useVoteComment();

    const isLoading = isVotingPost || isVotingComment;

    const handleVote = (type) => {
        if (!userAuth?.access_token) {
            // Redirect to signin if user is not logged in
            return navigate('/signin');
        }

        if (!_id) {
            console.error('Cannot vote: item ID is missing');
            return;
        }

        const isUpvoted = upvotedBy.includes(userAuth.id);
        const isDownvoted = downvotedBy.includes(userAuth.id);

        let currentVote;
        if (isUpvoted) currentVote = 'up';
        if (isDownvoted) currentVote = 'down';

        const newVoteType = currentVote === type ? 'none' : type;
        
        // Call the correct mutation based on the prop
        if (isComment) {
            voteComment({ commentId: _id, voteType: newVoteType });
        } else {
            votePost({ postId: _id, voteType: newVoteType });
        }
    };

    // Determine vote status from props with safety checks
    const isUpvoted = userAuth?.id ? upvotedBy.includes(userAuth.id) : false;
    const isDownvoted = userAuth?.id ? downvotedBy.includes(userAuth.id) : false;

    return (
        <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-black rounded-l-lg">
            <button
                onClick={() => handleVote('up')}
                disabled={isLoading}
                className={`text-2xl hover:bg-grey-light dark:hover:bg-grey rounded-full p-1 transition-colors ${
                    isUpvoted ? 'text-blue' : 'text-dark-grey'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Upvote"
            >
                <i className="fi fi-rr-arrow-up"></i>
            </button>
            <span 
                className={`font-bold my-1 text-lg ${
                    isUpvoted ? 'text-blue' : isDownvoted ? 'text-red' : 'text-dark-grey'
                }`}
            >
                {votes}
            </span>
            <button
                onClick={() => handleVote('down')}
                disabled={isLoading}
                className={`text-2xl hover:bg-grey-light dark:hover:bg-grey rounded-full p-1 transition-colors ${
                    isDownvoted ? 'text-red' : 'text-dark-grey'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Downvote"
            >
                <i className="fi fi-rr-arrow-down"></i>
            </button>
        </div>
    );
};

export default VoteButtons;