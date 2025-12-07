/*
 * PATH: src/pages/ReaditPostPage.jsx
 * PHASE 4: Vibrant UI with real-time updates, enhanced SEO, glassmorphism
 */
import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReaditPost } from '../hooks/useReaditApi';
import Loader from '../components/Loader';
import VoteButtons from '../components/readit/VoteButtons';
import ReaditCommentSection from '../components/readit/ReaditCommentSection';
import PostFlair from '../components/readit/PostFlair';
import PageTransition from '../components/readit/PageTransition';
import { getDay } from '../common/date';
import ReactMarkdown from 'react-markdown';
import SEO from '../common/seo';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

// Loading skeleton
const PostSkeleton = () => (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-pulse">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex gap-2 mb-4">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
    </div>
);

// Error display
const ErrorDisplay = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] text-center px-4"
    >
        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mb-6">
            <i className="fi fi-rr-exclamation text-5xl text-red-500"></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
            This post may have been removed or doesn't exist.
        </p>
        <Link
            to="/readit"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
        >
            <i className="fi fi-rr-arrow-left mr-2"></i> Back to Home
        </Link>
    </motion.div>
);

const ReaditPostPage = () => {
    const { postId } = useParams();
    const { post, isLoading, error, refetch } = useReaditPost(postId);
    const { socket } = useSocket();

    const [localPost, setLocalPost] = useState(null);

    // Scroll restoration
    useEffect(() => {
        window.scrollTo(0, 0);
        return () => { document.body.style.overflow = 'unset'; };
    }, [postId]);

    // Sync local state with fetched post
    useEffect(() => {
        if (post) setLocalPost(post);
    }, [post]);

    // Real-time updates
    useEffect(() => {
        if (!socket || !postId) return;

        const handlePostUpdate = (updated) => {
            if (updated._id === postId) {
                setLocalPost(prev => ({ ...prev, ...updated }));
            }
        };

        const handleVoteUpdate = (data) => {
            if (data.itemId === postId) {
                setLocalPost(prev => prev ? { ...prev, score: data.score } : prev);
            }
        };

        socket.on('postUpdated', handlePostUpdate);
        socket.on('postVoteUpdate', handleVoteUpdate);

        return () => {
            socket.off('postUpdated', handlePostUpdate);
            socket.off('postVoteUpdate', handleVoteUpdate);
        };
    }, [socket, postId]);

    if (isLoading) return <PostSkeleton />;
    if (error || !localPost) return <ErrorDisplay />;

    const { author, title, content, community, createdAt, postType, url, image, commentCount, flair } = localPost;

    const handleShare = async () => {
        const link = `${window.location.origin}/readit/post/${postId}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, url: link });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied!");
                }
            }
        } else {
            navigator.clipboard.writeText(link);
            toast.success("Link copied to clipboard!");
        }
    };

    const handleSave = () => {
        toast.success("Post saved!", { icon: '🔖' });
    };

    const renderPostContent = () => {
        switch (postType) {
            case 'text':
                return content ? (
                    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                ) : null;

            case 'link':
                return (
                    <motion.a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.01 }}
                        className="block p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg">
                                <i className="fi fi-rr-link text-2xl"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-blue-600 dark:text-blue-400 font-bold text-lg truncate">{url}</p>
                                <p className="text-blue-500/70 text-sm">Click to open external link</p>
                            </div>
                            <i className="fi fi-rr-arrow-up-right-from-square text-xl text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                        </div>
                    </motion.a>
                );

            case 'image':
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl"
                    >
                        <img
                            src={image}
                            alt={title}
                            className="max-h-[80vh] w-full object-contain"
                            loading="lazy"
                        />
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
                {/* Decorative backgrounds */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
                </div>

                <SEO
                    title={`${title} | Readit`}
                    description={content?.substring(0, 160) || title}
                    image={image || community?.icon}
                    type="article"
                    schema={{
                        "@context": "https://schema.org",
                        "@type": "DiscussionForumPosting",
                        "headline": title,
                        "text": content,
                        "image": image,
                        "datePublished": createdAt,
                        "author": {
                            "@type": "Person",
                            "name": author?.personal_info?.username
                        },
                        "discussionUrl": `${window.location.origin}/readit/post/${postId}`,
                        "interactionStatistic": [
                            {
                                "@type": "InteractionCounter",
                                "@type": "LikeAction",
                                "userInteractionCount": localPost.score || 0
                            },
                            {
                                "@type": "InteractionCounter",
                                "interactionType": "CommentAction",
                                "userInteractionCount": commentCount || 0
                            }
                        ]
                    }}
                />

                <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-4"
                    >
                        <Link
                            to={community ? `/readit/c/${community.name}` : '/readit'}
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                        >
                            <i className="fi fi-rr-arrow-left"></i>
                            <span>{community ? `c/${community.name}` : 'Home'}</span>
                        </Link>
                    </motion.div>

                    {/* Main Post Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden mb-6"
                    >
                        <div className="flex">
                            {/* Desktop Vote Sidebar */}
                            <div className="hidden md:flex w-16 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-r border-gray-200/50 dark:border-gray-800/50 py-6 flex-col items-center">
                                <VoteButtons item={localPost} orientation="vertical" size="lg" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 md:p-8">
                                {/* Meta */}
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                                    <Link
                                        to={`/readit/c/${community?.name}`}
                                        className="flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                                            {community?.icon ? (
                                                <img src={community.icon} alt="" className="w-full h-full rounded-lg object-cover" />
                                            ) : (
                                                community?.name?.[0]?.toUpperCase()
                                            )}
                                        </div>
                                        c/{community?.name}
                                    </Link>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span>u/{author?.personal_info?.username}</span>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span>{getDay(createdAt)}</span>
                                </div>

                                {/* Title + Flair */}
                                <div className="flex items-start gap-3 mb-6">
                                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight flex-1">
                                        {title}
                                    </h1>
                                    {flair && <PostFlair flair={flair} size="md" />}
                                </div>

                                {/* Content */}
                                <div className="mb-6">
                                    {renderPostContent()}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                                    {/* Mobile Vote */}
                                    <div className="md:hidden">
                                        <VoteButtons item={localPost} orientation="horizontal" />
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300">
                                            <i className="fi fi-rr-comment-alt text-orange-500"></i>
                                            <span>{commentCount || 0} Comments</span>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleShare}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <i className="fi fi-rr-share"></i>
                                            <span className="hidden sm:inline">Share</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <i className="fi fi-rr-bookmark"></i>
                                            <span className="hidden sm:inline">Save</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Comments Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
                    >
                        <div className="p-6 md:p-8">
                            <Suspense fallback={
                                <div className="py-10 text-center">
                                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading comments...</p>
                                </div>
                            }>
                                <ReaditCommentSection post={localPost} />
                            </Suspense>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ReaditPostPage;