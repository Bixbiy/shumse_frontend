/*
 * PATH: src/pages/ReaditHomePage.jsx
 */
import React, { useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { userContext } from '../App';
import axiosInstance from '../common/api'; 
import { toast } from 'react-hot-toast';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import InPageNavigation from '../components/inpage-navigation.component';
import Loader from '../components/loader.component'; 

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
    const { userAuth } = useContext(userContext);
    
    // UI State
    const [activeTab, setActiveTab] = useState('Popular Posts');
    const [sort, setSort] = useState('hot');
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    
    // Data State
    const [posts, setPosts] = useState([]);
    const [popularCommunities, setPopularCommunities] = useState([]);
    
    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Pagination Refs
    const page = useRef(1);
    const hasMore = useRef(true);

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
            <div className="w-full md:max-w-2xl">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <InPageNavigation
                        routes={['Popular Posts', 'Your Feed']}
                        defaultHidden={!isLoggedIn ? ['Your Feed'] : []}
                        defaultActiveIndex={activeTab === 'Your Feed' ? 1 : 0}
                        onRouteChange={handleNavChange}
                    />
                    
                    <div className="flex items-center gap-2">
                        {/* Sort Dropdown/Buttons */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            {['hot', 'new', 'top'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSort(opt)}
                                    className={`px-3 py-1 text-sm rounded-md capitalize transition-all ${
                                        sort === opt 
                                        ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-bold' 
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Create Button (Mobile/Desktop) */}
                        {isLoggedIn && (
                            <div className="relative z-20">
                                <button 
                                    onClick={toggleCreateMenu}
                                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95"
                                >
                                    <i className="fi fi-rr-plus text-xl block"></i>
                                </button>
                                <AnimatePresence>
                                    {showCreateMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                        >
                                            <Link to="/readit/create-post" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                                                <i className="fi fi-rr-edit mr-2 text-blue-500"></i> Create Post
                                            </Link>
                                            <Link to="/readit/create-community" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-t border-gray-100 dark:border-gray-700">
                                                <i className="fi fi-rr-users mr-2 text-green-500"></i> Create Community
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* POST LIST */}
                <div className="min-h-[50vh]">
                    {isLoading ? (
                        <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                        </>
                    ) : posts.length > 0 ? (
                        <>
                            {posts.map((post) => (
                                <ReaditPostCard key={post._id} post={post} />
                            ))}
                            
                            {/* Load More */}
                            {hasMore.current && (
                                <button 
                                    onClick={() => fetchPosts(false)}
                                    disabled={isFetchingMore}
                                    className="w-full py-3 mt-4 text-blue-500 font-medium hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    {isFetchingMore ? <Loader /> : "Load More Posts"}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <i className="fi fi-rr-confetti text-4xl text-gray-400 mb-3 block"></i>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts yet</h3>
                            <p className="text-gray-500 text-sm">Be the first to share something!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR (Desktop Only) */}
            <div className="hidden md:block w-80 shrink-0">
                <div className="sticky top-24 space-y-6">
                    
                    {/* Welcome Widget */}
                    {!isLoggedIn && (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 border border-orange-100 dark:border-gray-700 p-5 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <i className="fi fi-rr-alien text-orange-500"></i> New to Readit?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Sign up to subscribe to communities and customize your feed.
                            </p>
                            <Link to="/signup" className="btn-dark w-full block text-center py-2 rounded-lg">
                                Join Now
                            </Link>
                        </div>
                    )}

                    {/* Popular Communities Widget */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Popular Communities</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {popularCommunities.slice(0, 5).map((comm, i) => (
                                <Link 
                                    key={comm._id} 
                                    to={`/readit/c/${comm.name}`}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <span className="font-bold text-gray-400 w-4 text-center">{i+1}</span>
                                    <img src={comm.icon || '/default-community.png'} alt={comm.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-gray-900 dark:text-white">c/{comm.name}</p>
                                        <p className="text-xs text-gray-500">{comm.memberCount} members</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="text-xs text-gray-400 px-2 flex flex-wrap gap-x-4 gap-y-2">
                        <Link to="#" className="hover:underline">Privacy Policy</Link>
                        <Link to="#" className="hover:underline">User Agreement</Link>
                        <span>© 2025 Readit</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ReaditHomePage;