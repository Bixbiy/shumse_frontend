// src/pages/ReaditHomePage.jsx - OPTIMIZED VERSION
import React, { useContext, useState, useMemo, useCallback } from 'react';
import { userContext } from '../App';
import { useHomeFeed, usePublicFeed, usePopularCommunities } from '../hooks/useReaditApi';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import Loader from '../components/loader.component';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ReaditHomePage = () => {
    const { userAuth } = useContext(userContext);
    const [sort, setSort] = useState('hot');
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    
    // Memoized user status
    const isLoggedIn = useMemo(() => !!userAuth?.access_token, [userAuth]);
    
    // Personalized feed for logged-in users
    const { 
        data: homeFeedData, 
        isLoading: homeFeedLoading, 
        fetchNextPage: fetchNextHomePage,
        hasNextPage: hasNextHomePage,
        isFetchingNextPage: isFetchingNextHomePage
    } = useHomeFeed(sort);
    
    // Public feed for non-logged-in users
    const { 
        data: publicFeedData, 
        isLoading: publicFeedLoading, 
        fetchNextPage: fetchNextPublicPage,
        hasNextPage: hasNextPublicPage,
        isFetchingNextPage: isFetchingNextPublicPage
    } = usePublicFeed(sort);
    
    const { data: popularCommunities, isLoading: communitiesLoading } = usePopularCommunities();

    // Memoized derived state
    const isLoading = homeFeedLoading || publicFeedLoading;
    const feedData = isLoggedIn ? homeFeedData : publicFeedData;
    const hasNextPage = isLoggedIn ? hasNextHomePage : hasNextPublicPage;
    const fetchNextPage = isLoggedIn ? fetchNextHomePage : fetchNextPublicPage;
    const isFetchingNextPage = isLoggedIn ? isFetchingNextHomePage : isFetchingNextPublicPage;

    // Memoized callbacks
    const handleSortChange = useCallback((newSort) => {
        setSort(newSort);
    }, []);

    const toggleCreateMenu = useCallback(() => {
        setShowCreateMenu(prev => !prev);
    }, []);

    const closeCreateMenu = useCallback(() => {
        setShowCreateMenu(false);
    }, []);

    // Memoized posts for rendering
    const postsToRender = useMemo(() => {
        if (!feedData?.pages) return [];
        return feedData.pages.flatMap(page => page.posts || []);
    }, [feedData]);

    // Loading state
    if (isLoading) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoggedIn ? 'Your Feed' : 'Popular Posts'}
                </h1>
                
                <div className="flex items-center gap-4">
                    {/* Sort Options */}
                    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                        {['hot', 'new', 'top'].map((sortOption) => (
                            <button
                                key={sortOption}
                                onClick={() => handleSortChange(sortOption)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    sort === sortOption 
                                        ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {sortOption === 'hot' && '🔥 Hot'}
                                {sortOption === 'new' && '🆕 New'}
                                {sortOption === 'top' && '⭐ Top'}
                            </button>
                        ))}
                    </div>

                    {/* Create Button for logged-in users */}
                    {isLoggedIn && (
                        <div className="relative">
                            <button
                                onClick={toggleCreateMenu}
                                onBlur={closeCreateMenu}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-colors shadow-lg"
                            >
                                <i className="fi fi-rr-plus"></i>
                                Create
                            </button>

                            <AnimatePresence>
                                {showCreateMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                                    >
                                        <Link
                                            to="/readit/create-community"
                                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg transition-colors"
                                            onClick={closeCreateMenu}
                                        >
                                            <i className="fi fi-rr-users text-purple-500"></i>
                                            Create Community
                                        </Link>
                                        <Link
                                            to="/readit/create-post"
                                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                                            onClick={closeCreateMenu}
                                        >
                                            <i className="fi fi-rr-edit text-blue-500"></i>
                                            Create Post
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Welcome message for non-logged-in users */}
            {!isLoggedIn && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg">
                            <i className="fi fi-rr-globe text-blue-600 dark:text-blue-300 text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                                Welcome to Readit!
                            </h2>
                            <p className="text-blue-700 dark:text-blue-300 mb-3">
                                Join communities, share posts, and connect with like-minded people.
                            </p>
                            {popularCommunities && popularCommunities.length > 0 && (
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Popular communities: {popularCommunities.slice(0, 3).map(c => `c/${c.name}`).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
                {postsToRender.map((post, index) => (
                    <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    >
                        <ReaditPostCard post={post} />
                    </motion.div>
                ))}
                
                {/* Empty State */}
                {postsToRender.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                            <i className="fi fi-rr-post text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No posts found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {!isLoggedIn 
                                    ? "Join some communities to see posts in your feed!" 
                                    : "Be the first to post in your communities!"
                                }
                            </p>
                            {isLoggedIn && (
                                <Link
                                    to="/readit/create-post"
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium inline-flex items-center gap-2 transition-colors"
                                >
                                    <i className="fi fi-rr-edit"></i>
                                    Create Post
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <i className="fi fi-rr-refresh"></i>
                                Load More Posts
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Popular Communities Section for non-logged-in users */}
            {!isLoggedIn && popularCommunities && popularCommunities.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Communities</h2>
                        <Link 
                            to="/signin"
                            className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1"
                        >
                            Join to participate
                            <i className="fi fi-rr-arrow-right text-xs"></i>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularCommunities.slice(0, 6).map((community, index) => (
                            <motion.div
                                key={community._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:border-orange-200 dark:hover:border-orange-800 group"
                            >
                                <Link to={`/readit/c/${community.name}`} className="block">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative">
                                            <img 
                                                src={community.icon || '/default-community.png'} 
                                                alt={community.name}
                                                className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 group-hover:border-orange-300 transition-colors"
                                                loading="lazy"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                c/{community.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{community.memberCount} members</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{community.description}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ReaditHomePage;