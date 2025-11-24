import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../App';
import { votePost, voteComment } from '../../hooks/useReaditApi';
import toast from 'react-hot-toast';
import { handleError } from '../../common/errorHandler';

const VoteButtons = ({ item, isComment = false }) => {
    const { userAuth } = useContext(UserContext);

    if (!item) return null;

    const [score, setScore] = useState(item.score || 0);
    const [userVote, setUserVote] = useState(item.userVote || 'none');
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        setScore(item.score || 0);
        setUserVote(item.userVote || 'none');
    }, [item.score, item.userVote]);

    const handleVote = async (type) => {
        if (!userAuth?.access_token) return toast.error("Please login to vote");
        if (isVoting) return;

        const previousVote = userVote;
        const previousScore = score;

        // LOGIC FIX: Determine the actual vote to send (toggle off if same)
        let voteToSend = type;
        if (previousVote === type) {
            voteToSend = 'none';
        }

        // Calculate optimistic score
        let newScore = score;

        // Remove previous vote effect
        if (previousVote === 'up') newScore--;
        if (previousVote === 'down') newScore++;

        // Add new vote effect
        if (voteToSend === 'up') newScore++;
        if (voteToSend === 'down') newScore--;

        // Apply Optimistic Update
        setUserVote(voteToSend);
        setScore(newScore);
        setIsVoting(true);

        try {
            const apiCall = isComment ? voteComment : votePost;
            await apiCall(item._id, voteToSend);
        } catch (err) {
            handleError(err, "Vote failed");
            // Rollback
            setUserVote(previousVote);
            setScore(previousScore);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className={`flex flex-col items-center ${isComment ? 'gap-0' : 'gap-1'}`}>
            <button
                onClick={() => handleVote('up')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${userVote === 'up' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
                    }`}
                aria-label="Upvote"
            >
                <i className={`fi ${userVote === 'up' ? 'fi-sr-arrow-square-up' : 'fi-rr-arrow-square-up'} text-2xl`} aria-hidden="true"></i>
            </button>

            <span className={`text-sm font-bold ${userVote === 'up' ? 'text-orange-500' :
                userVote === 'down' ? 'text-blue-500' : 'text-black dark:text-white'
                }`}>
                {Intl.NumberFormat('en-US', { notation: "compact" }).format(score)}
            </span>

            <button
                onClick={() => handleVote('down')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${userVote === 'down' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                    }`}
                aria-label="Downvote"
            >
                <i className={`fi ${userVote === 'down' ? 'fi-sr-arrow-square-down' : 'fi-rr-arrow-square-down'} text-2xl`} aria-hidden="true"></i>
            </button>
        </div>
    );
};

export default VoteButtons;