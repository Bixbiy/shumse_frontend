/*
 * PATH: src/components/readit/ReaditPostCard.jsx
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { getDay } from '../../common/date';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ReaditPostCard = ({ post }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);

    // --- SAFETY CHECK: Prevent White Screen on Partial Data ---
    if (!post || !post._id) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
        );
    }

    // Destructure with Safe Defaults
    const { 
        author = {}, 
        title = 'Untitled', 
        content = '', 
        community = {}, 
        createdAt = new Date(), 
        votes = 0, 
        commentCount = 0, 
        _id,
        postType = 'text',
        image,
        url
    } = post;

    const username = author?.personal_info?.username || 'deleted_user';
    const communityName = community?.name || 'unknown';
    const communityIcon = community?.icon || '';

    const handleShare = async (method = 'copy') => {
        const postUrl = `${window.location.origin}/readit/post/${_id}`;
        
        switch (method) {
            case 'copy':
                try {
                    await navigator.clipboard.writeText(postUrl);
                    toast.success('Link copied!');
                } catch (err) {
                    toast.error('Failed to copy link');
                }
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                break;
            // Add other cases as needed
        }
        setShowShareMenu(false);
    };

    const renderPostPreview = () => {
        switch (postType) {
            case 'image':
                return image ? (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        <img src={image} alt={title} className="w-full max-h-[500px] object-contain" loading="lazy" />
                    </div>
                ) : null;
            case 'link':
                return url ? (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 transition-colors">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500">
                            <i className="fi fi-rr-link text-sm"></i>
                            <span className="text-sm truncate flex-1 underline">{url}</span>
                            <i className="fi fi-rr-arrow-up-right-from-square text-xs"></i>
                        </a>
                    </div>
                ) : null;
            default:
                return content ? (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-3 font-serif leading-relaxed">{content}</p>
                ) : null;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 mb-4 overflow-hidden"
        >
            <div className="flex">
                {/* Vote Sidebar */}
                <div className="w-10 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 flex flex-col items-center py-2 gap-1">
                    <VoteButtons item={post} />
                </div>
                
                {/* Main Content */}
                <div className="p-3 pt-2 flex-1 min-w-0">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1 flex-wrap">
                        <Link 
                            to={`/readit/c/${communityName}`} 
                            className="flex items-center gap-1 font-bold text-black dark:text-white hover:underline"
                        >
                            {communityIcon && (
                                <img src={communityIcon} alt={communityName} className="w-4 h-4 rounded-full object-cover" />
                            )}
                            c/{communityName}
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="hover:underline cursor-pointer">Posted by u/{username}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>{getDay(createdAt)}</span>
                    </div>

                    {/* Title & Body */}
                    <Link to={`/readit/post/${_id}`} className="block group">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {title}
                        </h3>
                        {renderPostPreview()}
                    </Link>
                    
                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 mt-2">
                        <Link 
                            to={`/readit/post/${_id}#comments`} 
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold transition-colors"
                        >
                            <i className="fi fi-rr-comment-alt"></i>
                            {commentCount} Comments
                        </Link>
                        
                        <button 
                            onClick={() => handleShare('copy')}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold transition-colors"
                        >
                            <i className="fi fi-rr-share"></i> Share
                        </button>
                        
                        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold transition-colors">
                            <i className="fi fi-rr-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ReaditPostCard;