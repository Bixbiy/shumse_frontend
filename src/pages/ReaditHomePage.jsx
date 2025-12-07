/*
 * PATH: src/pages/ReaditHomePage.jsx
 * PHASE 4: Completely revamped with vibrant UI, real-time updates, SEO optimized
 */
import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadit } from '../hooks/useReadit';
import { UserContext } from '../App';
import InfiniteScrollFeed from '../components/readit/InfiniteScrollFeed';
import PullToRefresh from '../components/readit/PullToRefresh';
import PageTransition from '../components/readit/PageTransition';
import axiosInstance from '../common/api';
import { useSocket } from '../context/SocketContext';

// Vibrant Sort Button Component
const SortButton = memo(({ option, active, onClick, icon }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(option)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${active
            ? 'bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/30'
            : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50'
            }`}
    >
        <i className={`fi ${icon}`}></i>
        <span className="capitalize">{option}</span>
    </motion.button>
));

// Community Card - Vibrant Design
const CommunityCard = memo(({ community }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group"
    >
        <Link
            to={`/readit/c/${community.name}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300"
        >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                {community.icon ? (
                    <img src={community.icon} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                    community.name[0].toUpperCase()
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                    c/{community.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {community.memberCount?.toLocaleString() || 0} members
                </p>
            </div>
            <i className="fi fi-rr-angle-small-right text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
        </Link>
    </motion.div>
));

// Trending Ticker Component
const TrendingTicker = ({ communities }) => {
    if (!communities || communities.length === 0) return null;

    return (
        <div className="w-full overflow-hidden bg-orange-500/10 border-y border-orange-500/20 py-2 mb-6 backdrop-blur-sm">
            <div className="flex whitespace-nowrap animate-scroll">
                {[...communities, ...communities].map((c, i) => (
                    <Link
                        key={`${c._id}-${i}`}
                        to={`/readit/c/${c.name}`}
                        className="inline-flex items-center gap-2 mx-6 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-orange-500 transition-colors"
                    >
                        <span className="text-orange-500">#</span>
                        {c.name}
                        <span className="text-xs font-normal text-gray-500 opacity-70">
                            {Intl.NumberFormat('en-US', { notation: "compact" }).format(c.memberCount)}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

// Sidebar Skeleton
const SidebarSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

const ReaditHomePage = () => {
    const { userAuth } = useContext(UserContext);
    const { socket } = useSocket();

    const {
        posts,
        isLoading,
        isFetchingMore,
        hasMore,
        sort,
        setSort,
        activeTab,
        setActiveTab,
        loadMore,
        isLoggedIn,
        refresh
    } = useReadit('hot');

    const [popularCommunities, setPopularCommunities] = useState([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch popular communities
    useEffect(() => {
        const fetchPopular = async () => {
            setCommunitiesLoading(true);
            try {
                const { data } = await axiosInstance.get('/readit/communities/popular');
                setPopularCommunities(data || []);
            } catch (err) {
                console.error("Failed to fetch popular communities", err);
            } finally {
                setCommunitiesLoading(false);
            }
        };
        fetchPopular();
    }, []);

    // Real-time new post listener
    useEffect(() => {
        if (!socket) return;

        socket.on('newReaditPost', (post) => {
            // Optimistic update could happen here, or just let the feed refresh eventually
            console.log('New post received:', post.title);
        });

        return () => socket.off('newReaditPost');
    }, [socket]);

    // Scroll lock for mobile sidebar
    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSidebarOpen]);

    const handleRefresh = useCallback(async () => {
        if (refresh) await refresh();
    }, [refresh]);

    const sortOptions = [
        { key: 'hot', icon: 'fi-rr-flame' },
        { key: 'new', icon: 'fi-rr-sparkles' },
        { key: 'top', icon: 'fi-rr-trophy' }
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black transition-colors duration-300">
                {/* SEO Optimized Head */}
                <Helmet>
                    <title>Readit by Shums | Discover, Share, Connect</title>
                    <meta name="description" content="Join Readit - the modern community platform where ideas come alive. Share stories, discover trends, and connect with passionate communities." />
                    <meta name="keywords" content="readit, community, forum, discussion, social, trends, posts" />
                    <meta property="og:title" content="Readit by Shums | Discover, Share, Connect" />
                    <meta property="og:description" content="The modern community platform where ideas come alive" />
                    <meta property="og:type" content="website" />
                    <link rel="canonical" href={window.location.origin + '/readit'} />
                </Helmet>

                {/* Decorative Background Elements */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden sticky top-[60px] z-40 px-4 py-3">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <i className="fi fi-rr-menu-burger text-lg dark:text-white"></i>
                                <span className="font-bold bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">Readit</span>
                            </button>
                            <Link
                                to="/readit/create-post"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl transition-shadow"
                            >
                                <i className="fi fi-rr-plus"></i>
                                <span className="hidden xs:inline">Create</span>
                            </Link>
                        </div>

                        {/* Sort Pills */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {sortOptions.map(({ key, icon }) => (
                                <SortButton key={key} option={key} active={sort === key} onClick={setSort} icon={icon} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Sidebar Drawer */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
                            >
                                {/* Sidebar Header */}
                                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-700 p-6 z-10">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white">Readit</h2>
                                        <button
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                                        >
                                            <i className="fi fi-rr-cross-small text-xl"></i>
                                        </button>
                                    </div>
                                    <p className="text-white/80 text-sm mt-1">Discover communities</p>
                                </div>

                                {/* Quick Links */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                    <div className="space-y-2">
                                        <Link to="/readit" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium">
                                            <i className="fi fi-rr-home"></i> Home
                                        </Link>
                                        {isLoggedIn && (
                                            <Link to="/readit/create-community" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white">
                                                <i className="fi fi-rr-plus-small"></i> Create Community
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Popular Communities */}
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                        🔥 Popular Communities
                                    </h3>
                                    {communitiesLoading ? (
                                        <SidebarSkeleton />
                                    ) : popularCommunities.length > 0 ? (
                                        <div className="space-y-2">
                                            {popularCommunities.map((c) => (
                                                <CommunityCard key={c._id} community={c} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No communities yet</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">

                    {/* Trending Ticker (Desktop only for now) */}
                    <div className="hidden md:block">
                        <TrendingTicker communities={popularCommunities} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Feed Column */}
                        <div className="lg:col-span-8">
                            {/* Desktop Header */}
                            <div className="hidden md:block mb-6">
                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg p-4">
                                    <div className="flex items-center justify-between">
                                        {/* Feed Tabs */}
                                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                            {['Popular Posts', 'Your Feed'].map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    disabled={tab === 'Your Feed' && !isLoggedIn}
                                                    className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab
                                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Sort Options */}
                                        <div className="flex gap-2">
                                            {sortOptions.map(({ key, icon }) => (
                                                <SortButton key={key} option={key} active={sort === key} onClick={setSort} icon={icon} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Create Post CTA */}
                            <Link
                                to="/readit/create-post"
                                className="hidden md:flex items-center gap-4 p-4 mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:border-orange-300 dark:hover:border-orange-600 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <i className="fi fi-rr-edit text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                        Create a post...
                                    </p>
                                </div>
                                <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 group-hover:shadow-xl transition-shadow">
                                    Post
                                </div>
                            </Link>

                            {/* Posts Feed with Pull to Refresh */}
                            <PullToRefresh onRefresh={handleRefresh}>
                                <InfiniteScrollFeed
                                    posts={posts}
                                    isLoading={isLoading}
                                    isFetchingMore={isFetchingMore}
                                    hasMore={hasMore}
                                    loadMore={loadMore}
                                />
                            </PullToRefresh>
                        </div>

                        {/* Sidebar Column - Desktop */}
                        <div className="hidden lg:block lg:col-span-4">
                            <div className="sticky top-[80px] space-y-6">
                                {/* Popular Communities */}
                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <i className="fi fi-rr-flame"></i> Popular Communities
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {communitiesLoading ? (
                                            <SidebarSkeleton />
                                        ) : popularCommunities.length > 0 ? (
                                            popularCommunities.slice(0, 5).map((c) => (
                                                <CommunityCard key={c._id} community={c} />
                                            ))
                                        ) : (
                                            <div className="text-center py-6">
                                                <i className="fi fi-rr-users text-4xl text-gray-300 dark:text-gray-700 mb-2"></i>
                                                <p className="text-gray-500">No communities yet</p>
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        to="/readit/communities"
                                        className="block p-4 text-center text-orange-500 hover:text-orange-600 font-bold border-t border-gray-200 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                    >
                                        View All Communities →
                                    </Link>
                                </div>

                                {/* Create Community CTA */}
                                {isLoggedIn && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <i className="fi fi-rr-users-alt text-9xl"></i>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 relative z-10">Start Your Community</h3>
                                        <p className="text-white/80 text-sm mb-4 relative z-10">Create a space for your interests and connect with like-minded people.</p>
                                        <Link
                                            to="/readit/create-community"
                                            className="block w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-center hover:bg-gray-100 transition-colors relative z-10"
                                        >
                                            <i className="fi fi-rr-plus mr-2"></i> Create Community
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Footer Links */}
                                <div className="text-center text-xs text-gray-400 dark:text-gray-600 space-y-2">
                                    <p>© {new Date().getFullYear()} Readit by Shums</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <Link to="/about" className="hover:text-gray-600 dark:hover:text-gray-400">About</Link>
                                        <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-gray-400">Privacy</Link>
                                        <Link to="/terms" className="hover:text-gray-600 dark:hover:text-gray-400">Terms</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CSS for scrolling ticker */}
                <style jsx>{`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-scroll {
                        animation: scroll 30s linear infinite;
                    }
                    .animate-scroll:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </div>
        </PageTransition>
    );
};

export default ReaditHomePage;

