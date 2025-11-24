/*
 * PATH: src/pages/ReaditHomePage.jsx
 */
import React, { useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { UserContext } from '../App';
import axiosInstance from '../common/api';
import { toast } from 'react-hot-toast';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import ReaditSidebar from '../components/readit/ReaditSidebar';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import InPageNavigation from '../components/InPageNavigation';
import Loader from '../components/Loader';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

// Simple skeleton for loading state
const PostCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
);

const ReaditHomePage = () => {
    const { userAuth } = useContext(UserContext);

    // UI State
    const [activeTab, setActiveTab] = useState('Popular Posts');
    const [sort, setSort] = useState('hot');
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Data State
    const [posts, setPosts] = useState([]);
    const [popularCommunities, setPopularCommunities] = useState([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Pagination Refs
    const page = useRef(1);
    const hasMore = useRef(true);
    const listRef = useRef(null);

    const isLoggedIn = useMemo(() => !!userAuth?.access_token, [userAuth]);

    // --- DATA FETCHING ---

    const fetchPopularCommunities = async () => {
        try {
            const { data } = await axiosInstance.get('/readit/communities/popular');
            setPopularCommunities(data || []);
        } catch (err) {
            console.error("Failed to fetch communities:", err);
        }
    };

    const fetchPosts = useCallback(async (isReset = false) => {
        if (isReset) {
            page.current = 1;
            hasMore.current = true;
            setPosts([]);
            setIsLoading(true);
        } else {
            setIsFetchingMore(true);
        }

        // Logic to determine endpoint
        let endpoint = '/readit/posts/public';
        if (activeTab === 'Your Feed' && isLoggedIn) {
            endpoint = '/readit/posts/feed';
        }

        try {
            const { data } = await axiosInstance.get(`${endpoint}?sort=${sort}&page=${page.current}&limit=10`);

            if (isReset) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }

            hasMore.current = data.hasMore;
            page.current += 1;

        } catch (err) {
            console.error("Failed to fetch posts:", err);
            toast.error("Could not load posts");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [activeTab, sort, isLoggedIn]);

    // --- VIRTUALIZATION ---
    const rowVirtualizer = useWindowVirtualizer({
        count: posts.length,
        estimateSize: () => 200, // Estimate row height
        overscan: 5,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    // Infinite Scroll Trigger
    useEffect(() => {
        const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
        if (!lastItem) return;

        if (
            lastItem.index >= posts.length - 1 &&
            hasMore.current &&
            !isFetchingMore &&
            !isLoading
        ) {
            fetchPosts(false);
        }
    }, [
        hasMore,
        fetchPosts,
        posts.length,
        isFetchingMore,
        isLoading,
        rowVirtualizer.getVirtualItems(),
    ]);


    // --- EFFECTS ---

    useEffect(() => {
        fetchPopularCommunities();
    }, []);

    useEffect(() => {
        // If user logs out while on "Your Feed", switch back
        if (!isLoggedIn && activeTab === 'Your Feed') {
            setActiveTab('Popular Posts');
            return;
        }
        fetchPosts(true);
    }, [fetchPosts, activeTab, sort, isLoggedIn]);


    // --- HANDLERS ---

    const handleNavChange = (route) => setActiveTab(route);
    const toggleCreateMenu = () => setShowCreateMenu(prev => !prev);

    return (
        <div className="max-w-6xl mx-auto flex gap-8 justify-center p-4">

            {/* MAIN FEED COLUMN */}
            <div className="w-full md:max-w-2xl" ref={listRef}>
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Mobile Sidebar Toggle */}
                        <button
                            className="md:hidden btn-icon"
                            onClick={() => setShowMobileSidebar(true)}
                        >
                            <i className="fi fi-rr-menu-burger text-xl"></i>
                        </button>

                        <InPageNavigation
                            routes={['Popular Posts', 'Your Feed']}
                            defaultHidden={!isLoggedIn ? ['Your Feed'] : []}
                            defaultActiveIndex={activeTab === 'Your Feed' ? 1 : 0}
                            onRouteChange={handleNavChange}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {/* Sort Dropdown/Buttons */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            {['hot', 'new', 'top'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSort(opt)}
                                    className={`px-3 py-1 text-sm rounded-md capitalize transition-all ${sort === opt
                                        ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-bold'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Create Button */}
                        {isLoggedIn && (
                            <div className="relative z-20">
                                <button
                                    onClick={toggleCreateMenu}
                                    className="btn-icon bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                                >
                                    <i className="fi fi-rr-plus text-xl block"></i>
                                </button>
                                <AnimatePresence>
                                    {showCreateMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 card-elevated overflow-hidden z-50"
                                        >
                                            <Link to="/readit/create-post" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
                                                <i className="fi fi-rr-edit mr-2 text-blue-500"></i> Create Post
                                            </Link>
                                            <Link to="/readit/create-community" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-t border-gray-100 dark:border-gray-700 transition-colors">
                                                <i className="fi fi-rr-users mr-2 text-green-500"></i> Create Community
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* POST LIST (Virtualized) */}
                <div className="min-h-[50vh]">
                    {isLoading && posts.length === 0 ? (
                        <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                        </>
                    ) : posts.length > 0 ? (
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const post = posts[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.key}
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <ReaditPostCard post={post} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <i className="fi fi-rr-confetti text-4xl text-gray-400 mb-3 block"></i>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts yet</h3>
                            <p className="text-gray-500 text-sm">Be the first to share something!</p>
                        </div>
                    )}

                    {/* Bottom Loader */}
                    {isFetchingMore && (
                        <div className="py-4 flex justify-center">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR (Desktop) */}
            <div className="hidden md:block w-80 shrink-0">
                <div className="sticky top-24">
                    <ReaditSidebar popularCommunities={popularCommunities} isLoggedIn={isLoggedIn} />
                </div>
            </div>

            {/* MOBILE SIDEBAR (Drawer) */}
            <AnimatePresence>
                {showMobileSidebar && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileSidebar(false)}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white dark:bg-gray-900 z-50 md:hidden shadow-2xl overflow-y-auto p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Menu</h2>
                                <button onClick={() => setShowMobileSidebar(false)} className="btn-icon">
                                    <i className="fi fi-rr-cross text-xl"></i>
                                </button>
                            </div>
                            <ReaditSidebar popularCommunities={popularCommunities} isLoggedIn={isLoggedIn} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ReaditHomePage;