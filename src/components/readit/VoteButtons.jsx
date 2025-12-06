/*
 * PATH: src/components/readit/VoteButtons.jsx
 * FIXED: Removed call to non-existent /votes/status endpoint
 * Uses userVote from post response (backend already provides it)
 */
import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../../App';
import api from '../../common/api';
import toast from 'react-hot-toast';
import { VOTE_TYPES } from './constants';
import { useSocket } from '../../context/SocketContext';

// Animated Number Component
const AnimatedNumber = ({ value }) => {
    return (
        <div className="relative h-6 overflow-hidden min-w-[2ch] flex justify-center">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 flex items-center justify-center font-bold"
                >
                    {Intl.NumberFormat('en-US', { notation: "compact" }).format(value)}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const VoteButtons = ({ item, isComment = false, orientation = 'vertical', size = 'md' }) => {
    const { userAuth } = useContext(UserContext);
    const { socket } = useSocket();

    if (!item) return null;

    const [score, setScore] = useState(item.score || 0);
    // Backend returns 'up', 'down', or null - convert null to 'none'
    const [userVote, setUserVote] = useState(item.userVote || VOTE_TYPES.NONE);
    const [isVoting, setIsVoting] = useState(false);

    const isLoggedIn = !!userAuth?.access_token;

    // Sync with prop changes (when post data updates)
    useEffect(() => {
        setScore(item.score || 0);
        // Backend returns 'up', 'down', or null
        setUserVote(item.userVote || VOTE_TYPES.NONE);
    }, [item.score, item.userVote]);

    // Real-time vote updates via socket
    useEffect(() => {
        if (!socket || !item._id) return;

        const eventName = isComment ? 'commentVoteUpdate' : 'postVoteUpdate';

        const handleVoteUpdate = (data) => {
            if (data.itemId === item._id) {
                setScore(data.score);
            }
        };

        socket.on(eventName, handleVoteUpdate);
        return () => socket.off(eventName, handleVoteUpdate);
    }, [socket, item._id, isComment]);

    const handleVote = useCallback(async (type) => {
        if (!isLoggedIn) {
            return toast.error("Please login to vote");
        }
        if (isVoting) return;

        const previousVote = userVote;
        const previousScore = score;

        // Determine vote to send
        // If clicking same button, toggle off (send 'none')
        // Otherwise send the new vote type
        let voteToSend = type;
        if (previousVote === type) {
            voteToSend = VOTE_TYPES.NONE;
        }

        // Calculate optimistic score
        let newScore = score;
        if (previousVote === VOTE_TYPES.UP) newScore--;
        if (previousVote === VOTE_TYPES.DOWN) newScore++;
        if (voteToSend === VOTE_TYPES.UP) newScore++;
        if (voteToSend === VOTE_TYPES.DOWN) newScore--;

        // Apply optimistic update
        setUserVote(voteToSend);
        setScore(newScore);
        setIsVoting(true);

        try {
            const endpoint = isComment
                ? `/readit/comments/${item._id}/vote`
                : `/readit/posts/${item._id}/vote`;

            const { data } = await api.put(endpoint, { voteType: voteToSend });

            // Update with server response
            if (data.score !== undefined) {
                setScore(data.score);
            }
            if (data.userVote !== undefined) {
                setUserVote(data.userVote);
            }
        } catch (err) {
            // Rollback on error
            const errorMsg = err.response?.data?.error || "Vote failed";
            toast.error(errorMsg);
            setUserVote(previousVote);
            setScore(previousScore);
        } finally {
            setIsVoting(false);
        }
    }, [isLoggedIn, isVoting, userVote, score, isComment, item._id]);

    const isHorizontal = orientation === 'horizontal';

    // Size classes
    const sizeClasses = {
        sm: { icon: 'text-lg', padding: 'p-1', container: 'gap-0.5' },
        md: { icon: 'text-2xl', padding: 'p-1.5', container: 'gap-1' },
        lg: { icon: 'text-3xl', padding: 'p-2', container: 'gap-1.5' }
    };
    const sizeConfig = sizeClasses[size] || sizeClasses.md;

    return (
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center ${sizeConfig.container} bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-0.5`}>
            {/* Upvote Button */}
            <motion.button
                onClick={(e) => { e.stopPropagation(); handleVote(VOTE_TYPES.UP); }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                disabled={isVoting}
                className={`${sizeConfig.padding} rounded-lg transition-all duration-200 ${userVote === VOTE_TYPES.UP
                    ? 'text-orange-500 bg-orange-100 dark:bg-orange-500/20'
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                    } disabled:opacity-50`}
                aria-label="Upvote"
            >
                <i className={`fi ${userVote === VOTE_TYPES.UP ? 'fi-sr-arrow-square-up' : 'fi-rr-arrow-square-up'} ${sizeConfig.icon} leading-none`} />
            </motion.button>

            {/* Score */}
            <span className={`text-sm font-bold ${isHorizontal ? 'min-w-[2.5rem]' : 'min-w-[2rem]'} text-center transition-colors ${userVote === VOTE_TYPES.UP ? 'text-orange-500' :
                userVote === VOTE_TYPES.DOWN ? 'text-indigo-500' :
                    'text-gray-900 dark:text-gray-300'
                }`}>
                <AnimatedNumber value={score} />
            </span>

            {/* Downvote Button */}
            <motion.button
                onClick={(e) => { e.stopPropagation(); handleVote(VOTE_TYPES.DOWN); }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                disabled={isVoting}
                className={`${sizeConfig.padding} rounded-lg transition-all duration-200 ${userVote === VOTE_TYPES.DOWN
                    ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-500/20'
                    : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                    } disabled:opacity-50`}
                aria-label="Downvote"
            >
                <i className={`fi ${userVote === VOTE_TYPES.DOWN ? 'fi-sr-arrow-square-down' : 'fi-rr-arrow-square-down'} ${sizeConfig.icon} leading-none`} />
            </motion.button>
        </div>
    );
};

export default VoteButtons;