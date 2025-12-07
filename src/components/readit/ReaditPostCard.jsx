/*
 * PATH: src/components/readit/ReaditPostCard.jsx
 * FIXED: Nested anchor tags issue - using useNavigate for inner links
 */
import React, { memo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VoteButtons from './VoteButtons';
import PostFlair from './PostFlair';
import { getDay } from '../../common/date';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import OptimizedImage from '../OptimizedImage';
import VerificationBadge from '../VerificationBadge';

const ReaditPostCard = memo(({ post }) => {
    const navigate = useNavigate();

    if (!post || !post._id) return null;

    const { socket } = useSocket();
    const [postData, setPostData] = useState(post);
    const [isHovered, setIsHovered] = useState(false);

    // Sync with prop changes
    useEffect(() => {
        setPostData(post);
    }, [post]);

    // Real-time updates
    useEffect(() => {
        if (!socket || !post._id) return;

        const handleUpdate = (updated) => {
            if (updated._id === post._id) {
                setPostData(prev => ({ ...prev, ...updated }));
            }
        };

        const handleVoteUpdate = (data) => {
            if (data.itemId === post._id) {
                setPostData(prev => ({ ...prev, score: data.score }));
            }
        };

        socket.on('postUpdated', handleUpdate);
        socket.on('postVoteUpdate', handleVoteUpdate);

        return () => {
            socket.off('postUpdated', handleUpdate);
            socket.off('postVoteUpdate', handleVoteUpdate);
        };
    }, [socket, post._id]);

    const {
        author, title, content, community, createdAt,
        _id, postType, image, url, commentCount, flair, isNew
    } = postData;

    const handleCommunityClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (community?.name) {
            navigate(`/readit/c/${community.name}`);
        }
    };

    const handleShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const link = `${window.location.origin}/readit/post/${_id}`;

        if (navigator.share) {
            navigator.share({ title, url: link }).catch(() => {
                navigator.clipboard.writeText(link);
                toast.success("Link copied!");
            });
        } else {
            navigator.clipboard.writeText(link);
            toast.success("Link copied!");
        }
    };

    const handleExternalLink = (e) => {
        e.stopPropagation();
        // Let the link work naturally
    };

    const handleCardClick = (e) => {
        // Don't navigate if clicking on buttons or other interactive elements
        if (e.target.closest('button') || e.target.closest('[data-no-navigate]')) {
            return;
        }
        navigate(`/readit/post/${_id}`);
    };

    // Render Preview based on type
    const renderPreview = () => {
        if (postType === 'image' && image) {
            return (
                <div className="mt-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 max-h-[400px] flex justify-center">
                    <OptimizedImage
                        src={image}
                        alt={title}
                        className="max-h-[400px] w-auto object-contain"
                    />
                </div>
            );
        }

        if (postType === 'link' && url) {
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleExternalLink}
                    data-no-navigate
                    className="mt-4 block p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg text-white shadow-lg">
                            <i className="fi fi-rr-link"></i>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium truncate flex-1 text-sm">{url}</span>
                        <i className="fi fi-rr-arrow-up-right-from-square text-sm text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                </a>
            );
        }

        if (postType === 'text' && content) {
            return (
                <p className="mt-3 text-gray-600 dark:text-gray-400 line-clamp-3 text-sm leading-relaxed">
                    {content}
                </p>
            );
        }

        return null;
    };

    return (
        <motion.div
            initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -2 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={handleCardClick}
            className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${isHovered ? 'shadow-xl border-orange-200 dark:border-orange-800/50' : 'shadow-sm'
                } ${isNew ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}`}
        >
            {/* New post indicator */}
            {isNew && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    NEW
                </div>
            )}

            <div className="p-4 md:p-5">
                <div className="flex items-start gap-4">
                    {/* Vote Buttons - Desktop */}
                    <div className="hidden md:block" data-no-navigate>
                        <VoteButtons item={postData} orientation="vertical" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Meta Info */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                            {community && (
                                <>
                                    <button
                                        onClick={handleCommunityClick}
                                        className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                                        data-no-navigate
                                    >
                                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shadow-sm">
                                            {community?.icon ? (
                                                <img src={community.icon} alt="" className="w-full h-full rounded-md object-cover" />
                                            ) : (
                                                community.name[0].toUpperCase()
                                            )}
                                        </div>
                                        c/{community.name}
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                </>
                            )}
                            <span className="flex items-center gap-1">
                                u/{author?.personal_info?.username}
                                {author?.personal_info?.isVerified && <VerificationBadge size={12} />}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span>{getDay(createdAt)}</span>
                        </div>

                        {/* Title with Flair */}
                        <div className="flex items-start gap-2 mb-1">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight flex-1 group-hover:text-orange-500 transition-colors">
                                {title}
                            </h2>
                            {flair && <PostFlair flair={flair} size="sm" />}
                        </div>

                        {/* Preview */}
                        {renderPreview()}

                        {/* Footer Actions */}
                        <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                            {/* Mobile Vote Buttons */}
                            <div className="md:hidden" data-no-navigate>
                                <VoteButtons item={postData} orientation="horizontal" size="sm" />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <i className="fi fi-rr-comment-alt text-orange-500"></i>
                                <span className="font-medium">{commentCount || 0}</span>
                                <span className="hidden sm:inline">Comments</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                data-no-navigate
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <i className="fi fi-rr-share"></i>
                                <span className="hidden sm:inline font-medium">Share</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

ReaditPostCard.displayName = 'ReaditPostCard';

export default ReaditPostCard;