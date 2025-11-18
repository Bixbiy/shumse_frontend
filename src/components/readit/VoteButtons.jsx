import React, { useContext, useState, useEffect } from 'react';
import { userContext } from '../../App';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../common/api';
import toast from 'react-hot-toast';

const VoteButtons = ({ item, isComment = false }) => {
    const { userAuth } = useContext(userContext);
    const navigate = useNavigate();

    // Destructure safely with defaults
    const { 
        _id = '', 
        upvotedBy = [], 
        downvotedBy = [], 
        votes = 0 
    } = item || {};

    const [isLoading, setIsLoading] = useState(false);
    
    // OPTIMISTIC STATE
    const [currentVotes, setCurrentVotes] = useState(votes);
    const [userVote, setUserVote] = useState('none'); // 'up', 'down', 'none'

    // Sync state with props when they change (e.g. refetch)
    useEffect(() => {
        if (userAuth?.id) {
            if (upvotedBy.includes(userAuth.id)) setUserVote('up');
            else if (downvotedBy.includes(userAuth.id)) setUserVote('down');
            else setUserVote('none');
        } else {
            setUserVote('none');
        }
        setCurrentVotes(votes);
    }, [upvotedBy, downvotedBy, votes, userAuth]); // CHANGED: Removed userAuth.id to prevent crash

    const handleVote = async (newVoteType) => {
        if (!userAuth?.access_token) {
            return toast.error("Please sign in to vote");
        }
        if (!_id || isLoading) return;

        setIsLoading(true);

        // Capture previous state for rollback
        const prevVotes = currentVotes;
        const prevUserVote = userVote;

        // --- CALCULATE NEW STATE ---
        let nextUserVote = newVoteType;
        let nextVotes = currentVotes;

        if (prevUserVote === newVoteType) {
            // Deselecting (Removing vote)
            nextUserVote = 'none';
            if (newVoteType === 'up') nextVotes -= 1;
            if (newVoteType === 'down') nextVotes += 1;
        } else {
            // Changing vote or New vote
            if (prevUserVote === 'up') nextVotes -= 1;
            if (prevUserVote === 'down') nextVotes += 1;

            if (newVoteType === 'up') nextVotes += 1;
            if (newVoteType === 'down') nextVotes -= 1;
        }

        // Apply Optimistic Update
        setCurrentVotes(nextVotes);
        setUserVote(nextUserVote);

        try {
            // Determine what to send to server (it expects the intended state, or 'none' to remove)
            const votePayload = (prevUserVote === newVoteType) ? 'none' : newVoteType;
            
            const endpoint = isComment 
                ? `/readit/comments/${_id}/vote` 
                : `/readit/posts/${_id}/vote`;
            
            await axiosInstance.put(endpoint, { voteType: votePayload });
            // Success! No need to do anything else.

        } catch (err) {
            console.error("Vote failed:", err);
            toast.error("Vote failed");
            // Rollback
            setCurrentVotes(prevVotes);
            setUserVote(prevUserVote);
        } finally {
            setIsLoading(false);
        }
    };

    if (!item) return null;

    return (
        <div className={`flex flex-col items-center ${isComment ? 'gap-0' : 'gap-1'}`}>
            <button
                onClick={() => handleVote('up')}
                disabled={isLoading}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    userVote === 'up' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-400 hover:text-orange-500'
                }`}
            >
                <i className={`fi ${userVote === 'up' ? 'fi-sr-arrow-square-up' : 'fi-rr-arrow-square-up'} text-xl`}></i>
            </button>
            
            <span className={`text-xs font-bold ${
                userVote === 'up' ? 'text-orange-500' : 
                userVote === 'down' ? 'text-blue-500' : 
                'text-black dark:text-white'
            }`}>
                {Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(currentVotes)}
            </span>
            
            <button
                onClick={() => handleVote('down')}
                disabled={isLoading}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    userVote === 'down' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-blue-500'
                }`}
            >
                <i className={`fi ${userVote === 'down' ? 'fi-sr-arrow-square-down' : 'fi-rr-arrow-square-down'} text-xl`}></i>
            </button>
        </div>
    );
};

export default VoteButtons;