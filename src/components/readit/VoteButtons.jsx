import React, { useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { userContext } from '../../App';

const VoteButtons = ({ item, onVote, orientation = 'vertical', showCounts = false }) => {
    const { userAuth } = useContext(userContext);
    const userId = userAuth?.id;

    const [localVote, setLocalVote] = useState(null);
    const [localScore, setLocalScore] = useState(0);
    const [localUpvotes, setLocalUpvotes] = useState(0);
    const [localDownvotes, setLocalDownvotes] = useState(0);
    const [isVoting, setIsVoting] = useState(false);

    // Initialize state from item props
    useEffect(() => {
        if (item) {
            const userVote = userId ? 
                (item.upvotedBy?.includes(userId) ? 'up' : 
                 item.downvotedBy?.includes(userId) ? 'down' : null) : null;
            
            setLocalVote(userVote);
            setLocalScore(item.votes || 0);
            setLocalUpvotes(item.upvotesCount || item.upvotedBy?.length || 0);
            setLocalDownvotes(item.downvotesCount || item.downvotedBy?.length || 0);
        }
    }, [item, userId]);

    const handleVote = useCallback(async (newVoteType) => {
        if (!userId) {
            toast.error('You must be logged in to vote');
            return;
        }

        if (isVoting) return;
        setIsVoting(true);

        const oldVote = localVote;
        let finalVoteType = newVoteType;

        // If clicking the same vote, remove it
        if (newVoteType === oldVote) {
            finalVoteType = 'none';
        }

        // Optimistic update
        let newUpvotes = localUpvotes;
        let newDownvotes = localDownvotes;

        // Remove old vote
        if (oldVote === 'up') newUpvotes--;
        if (oldVote === 'down') newDownvotes--;

        // Add new vote
        if (finalVoteType === 'up') newUpvotes++;
        if (finalVoteType === 'down') newDownvotes++;

        setLocalUpvotes(newUpvotes);
        setLocalDownvotes(newDownvotes);
        setLocalScore(newUpvotes - newDownvotes);
        setLocalVote(finalVoteType === 'none' ? null : finalVoteType);

        try {
            await onVote(item._id, finalVoteType);
        } catch (err) {
            // Revert on error
            toast.error('Vote failed');
            const originalUpvotes = item.upvotesCount || item.upvotedBy?.length || 0;
            const originalDownvotes = item.downvotesCount || item.downvotedBy?.length || 0;
            const originalUserVote = userId ? 
                (item.upvotedBy?.includes(userId) ? 'up' : 
                 item.downvotedBy?.includes(userId) ? 'down' : null) : null;

            setLocalUpvotes(originalUpvotes);
            setLocalDownvotes(originalDownvotes);
            setLocalScore(originalUpvotes - originalDownvotes);
            setLocalVote(originalUserVote);
        } finally {
            setIsVoting(false);
        }
    }, [userId, localVote, localUpvotes, localDownvotes, item, onVote, isVoting]);

    const isVertical = orientation === 'vertical';

    return (
        <div className={`flex ${isVertical ? 'flex-col items-center' : 'flex-row items-center space-x-2'}`}>
            <button
                onClick={() => handleVote('up')}
                disabled={isVoting}
                className={`p-2 rounded-lg transition-all duration-200 ${
                    localVote === 'up'
                        ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                        : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Upvote"
            >
                <i className={`fi fi-rr-arrow-up text-lg ${localVote === 'up' ? 'fi-sr' : ''}`}></i>
            </button>

            <div className={`flex flex-col items-center ${isVertical ? 'my-2' : 'mx-2'}`}>
                <span className={`font-bold ${
                    localScore > 0 ? 'text-orange-500' : 
                    localScore < 0 ? 'text-blue-500' : 
                    'text-gray-500 dark:text-gray-400'
                } text-sm`}>
                    {localScore}
                </span>
                
                {showCounts && (
                    <div className="flex space-x-1 text-xs text-gray-400 mt-1">
                        <span className="text-orange-500">+{localUpvotes}</span>
                        <span>/</span>
                        <span className="text-blue-500">-{localDownvotes}</span>
                    </div>
                )}
            </div>

            <button
                onClick={() => handleVote('down')}
                disabled={isVoting}
                className={`p-2 rounded-lg transition-all duration-200 ${
                    localVote === 'down'
                        ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Downvote"
            >
                <i className={`fi fi-rr-arrow-down text-lg ${localVote === 'down' ? 'fi-sr' : ''}`}></i>
            </button>
        </div>
    );
};

export default VoteButtons;