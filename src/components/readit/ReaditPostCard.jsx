// src/components/readit/ReaditPostCard.jsx - ENHANCED VERSION
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { getDay } from '../../common/date';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ReaditPostCard = ({ post }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Add safety checks for undefined properties
    if (!post) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 animate-pulse">
                <div className="flex">
                    <div className="flex flex-col items-center pr-4">
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    const { 
        author = { personal_info: { username: 'Unknown' } }, 
        title = 'Untitled', 
        content = '', 
        community = { name: 'unknown', icon: null }, 
        createdAt = new Date(), 
        votes = 0, 
        commentCount = 0, 
        _id = '',
        postType = 'text',
        image,
        url
    } = post;

    const handleShare = async (method = 'copy') => {
        const postUrl = `${window.location.origin}/readit/post/${_id}`;
        
        switch (method) {
            case 'copy':
                try {
                    await navigator.clipboard.writeText(postUrl);
                    toast.success('Link copied to clipboard!');
                } catch (err) {
                    toast.error('Failed to copy link');
                }
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
                break;
        }
        setShowShareMenu(false);
    };

    const renderPostPreview = () => {
        switch (postType) {
            case 'image':
                return (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={image} alt={title} className="w-full max-h-64 object-cover" />
                    </div>
                );
            case 'link':
                return (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-600">
                            <i className="fi fi-rr-link text-sm"></i>
                            <span className="text-sm truncate flex-1">{url}</span>
                            <i className="fi fi-rr-arrow-up-right-from-square text-xs"></i>
                        </a>
                    </div>
                );
            default:
                return content && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-3">{content}</p>
                );
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-orange-200 dark:hover:border-orange-800"
        >
            <div className="flex">
                <VoteButtons item={post} />
                
                <div className="p-4 flex-1 min-w-0">
                    {/* Community and Author Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <Link 
                            to={`/readit/c/${community.name}`} 
                            className="flex items-center gap-1 font-medium hover:text-orange-500 transition-colors"
                        >
                            {community.icon && (
                                <img 
                                    src={community.icon} 
                                    alt={community.name}
                                    className="w-4 h-4 rounded-full"
                                />
                            )}
                            c/{community.name}
                        </Link>
                        <span>•</span>
                        <span>Posted by u/{author.personal_info.username}</span>
                        <span>•</span>
                        <span>{getDay(createdAt)}</span>
                    </div>

                    {/* Post Title and Content */}
                    <Link to={`/readit/post/${_id}`} className="block group">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                            {title}
                        </h3>
                        {renderPostPreview()}
                    </Link>
                    
                    {/* Post Actions */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Link 
                            to={`/readit/post/${_id}#comments`} 
                            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-sm font-medium"
                        >
                            <i className="fi fi-rr-comment-dots"></i>
                            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                        </Link>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors text-sm font-medium"
                            >
                                <i className="fi fi-rr-share"></i>
                                Share
                            </button>

                            {showShareMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10"
                                >
                                    <button
                                        onClick={() => handleShare('copy')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg transition-colors text-sm"
                                    >
                                        <i className="fi fi-rr-copy text-blue-500"></i>
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={() => handleShare('twitter')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <i className="fi fi-brands-twitter text-blue-400"></i>
                                        Share on Twitter
                                    </button>
                                    <button
                                        onClick={() => handleShare('facebook')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <i className="fi fi-brands-facebook text-blue-600"></i>
                                        Share on Facebook
                                    </button>
                                    <button
                                        onClick={() => handleShare('linkedin')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg transition-colors text-sm"
                                    >
                                        <i className="fi fi-brands-linkedin text-blue-700"></i>
                                        Share on LinkedIn
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors text-sm font-medium">
                            <i className="fi fi-rr-bookmark"></i>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ReaditPostCard;