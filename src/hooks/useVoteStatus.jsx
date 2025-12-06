/*
 * PATH: src/hooks/useVoteStatus.jsx
 * 
 * NOTE: The /readit/votes/status endpoint is NOT registered in the backend routes!
 * The backend already returns userVote in post/comment responses, so this hook
 * is kept as a utility for colors only.
 * 
 * DO NOT use the useVoteStatus hook - it will cause 404 errors.
 * Instead, rely on the userVote field returned by the backend.
 */
import { useState } from 'react';

/**
 * DEPRECATED: Do not use this hook!
 * The backend already provides userVote in post/comment responses.
 * This hook is kept for backward compatibility but does nothing.
 */
export const useVoteStatus = (itemIds, itemType = 'ReaditPost') => {
    const [voteStatus] = useState({});
    const [loading] = useState(false);
    const [error] = useState(null);

    // NOTE: Not fetching from /votes/status as it doesn't exist in backend routes
    // The backend already provides userVote in the post/comment response

    return {
        voteStatus,
        loading,
        error,
        refreshVotes: () => { } // No-op
    };
};

/**
 * Get color class based on vote type  
 * @param {String} voteType - 'up', 'down', or 'none'/null
 * @returns {String} - Tailwind color classes
 */
export const getVoteColor = (voteType) => {
    switch (voteType) {
        case 'up':
            return 'text-orange-500'; // Upvote = Orange
        case 'down':
            return 'text-blue-500'; // Downvote = Blue
        default:
            return 'text-gray-400'; // Default/None
    }
};

/**
 * Get background color class for vote buttons
 */
export const getVoteBgColor = (voteType) => {
    switch (voteType) {
        case 'up':
            return 'bg-orange-50 dark:bg-orange-900/20';
        case 'down':
            return 'bg-blue-50 dark:bg-blue-900/20';
        default:
            return 'bg-gray-50 dark:bg-gray-800';
    }
};

export default useVoteStatus;
