import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { getDay } from '../../common/date';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import OptimizedImage from '../OptimizedImage';

const ReaditPostCard = memo(({ post }) => {
    if (!post || !post._id) return null;

    const { socket } = useSocket();
    const [postData, setPostData] = useState(post);

    useEffect(() => {
        setPostData(post);
    }, [post]);

    useEffect(() => {
        if (!socket || !post._id) return;
        const handleUpdate = (updated) => {
            if (updated._id === post._id) {
                setPostData(prev => ({ ...prev, ...updated }));
            }
        };
        socket.on('postUpdated', handleUpdate);
        return () => socket.off('postUpdated', handleUpdate);
    }, [socket, post._id]);

    const {
        author, title, content, community, createdAt,
        _id, postType, image, url, commentCount
    } = postData;

    const handleShare = (e) => {
        e.preventDefault(); // Prevent link navigation if inside a Link
        navigator.clipboard.writeText(`${window.location.origin}/readit/post/${_id}`);
        toast.success("Link copied!");
    };

    // Render Preview based on type
    const renderPreview = () => {
        if (postType === 'image' && image) {
            return (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black max-h-[500px] flex justify-center">
                    <OptimizedImage
                        src={image}
                        alt={title}
                        className="max-h-[500px] object-contain"
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
                    className="mt-3 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    <i className="fi fi-rr-link" aria-hidden="true"></i>
                    <span className="truncate">{url}</span>
                </a>
            );
        }
        return <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{content}</p>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-blog flex mb-4"
        >
            {/* Sidebar Vote */}
            <div className="w-12 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 pt-2 flex flex-col items-center">
                <VoteButtons item={postData} />
            </div>

            {/* Content */}
            <div className="flex-1 p-3 min-w-0">
                {/* Meta Header */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    {community && (
                        <Link to={`/readit/c/${community.name}`} className="font-bold text-black dark:text-white hover:underline flex items-center gap-1">
                            {community.icon && <img src={community.icon} className="w-4 h-4 rounded-full" alt="" />}
                            c/{community.name}
                        </Link>
                    )}
                    <span>•</span>
                    <span className="hover:underline">u/{author?.personal_info?.username}</span>
                    <span>•</span>
                    <span>{getDay(createdAt)}</span>
                </div>

                {/* Body */}
                <Link to={`/readit/post/${_id}`} className="block group">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    {renderPreview()}
                </Link>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-3 text-xs font-bold text-gray-500">
                    <Link to={`/readit/post/${_id}`} className="btn-ghost btn-sm flex items-center gap-1">
                        <i className="fi fi-rr-comment-alt" aria-hidden="true"></i> {commentCount} Comments
                    </Link>
                    <button onClick={handleShare} className="btn-ghost btn-sm flex items-center gap-1">
                        <i className="fi fi-rr-share" aria-hidden="true"></i> Share
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

export default ReaditPostCard;