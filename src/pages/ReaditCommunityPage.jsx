/*
 * PATH: src/pages/ReaditCommunityPage.jsx
 */
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userContext } from '../App';
import axiosInstance from '../common/api';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

// --- SKELETON COMPONENT ---
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

const ErrorDisplay = ({ message = "An error occurred" }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
            <i className="fi fi-rr-exclamation text-3xl text-red-500"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{message}</h3>
        <Link to="/readit" className="mt-4 text-blue-500 hover:underline">Return to Home</Link>
    </div>
);

const CommunityNotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
            <i className="fi fi-rr-search-alt text-5xl text-gray-400"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
            The community you are looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-4">
            <Link to="/readit" className="btn-light px-6 py-2 rounded-full">Go Home</Link>
            <Link to="/readit/create-community" className="btn-dark px-6 py-2 rounded-full">Create Community</Link>
        </div>
    </div>
);

const ReaditCommunityPage = () => {
    const { communityName } = useParams();
    const { userAuth } = useContext(userContext);
    
    // State for data
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [sort, setSort] = useState('hot'); // 'hot', 'new', 'top'
    
    // State for loading and errors
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);
    const [arePostsLoading, setArePostsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [communityError, setCommunityError] = useState(null);
    
    // State for membership
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    // Refs for pagination
    const page = useRef(1);
    const hasMore = useRef(true);
    
    // --- 1. Fetch Community Details ---
    const fetchCommunity = useCallback(async () => {
        setIsCommunityLoading(true);
        setCommunityError(null);
        try {
            const { data } = await axiosInstance.get(`/readit/c/${communityName}`);
            setCommunity(data);
            
            // Check if user is already a member
            if (userAuth?.id && data.members) {
                setIsMember(data.members.some(m => m._id === userAuth.id || m === userAuth.id));
            }
        } catch (err) {
            console.error("Failed to fetch community:", err);
            setCommunityError(err);
        } finally {
            setIsCommunityLoading(false);
        }
    }, [communityName, userAuth?.id]);

    // --- 2. Fetch Posts ---
    const fetchPosts = useCallback(async (isReset = false) => {
        if (isReset) {
            page.current = 1;
            hasMore.current = true;
            setPosts([]);
            setArePostsLoading(true);
        } else {
            // Don't fetch if already loading or no more data
            if (isFetchingMore || !hasMore.current) return;
        }

        try {
            const { data } = await axiosInstance.get(`/readit/c/${communityName}/posts?sort=${sort}&page=${page.current}&limit=10`);
            
            if (isReset) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }
            
            page.current += 1;
            hasMore.current = data.hasMore;
        } catch (err) {
            console.error("Failed to fetch posts:", err);
        } finally {
            setArePostsLoading(false);
        }
    }, [communityName, sort]);

    const fetchMorePosts = async () => {
        if (isFetchingMore || !hasMore.current) return;
        setIsFetchingMore(true);
        await fetchPosts(false);
        setIsFetchingMore(false);
    };

    // --- 3. Join/Leave Community ---
    const handleJoinToggle = async () => {
        if (!userAuth?.access_token) return; // Or show login modal
        
        setIsJoining(true);
        try {
            await axiosInstance.post(`/readit/c/${communityName}/join`);
            setIsMember(!isMember); // Optimistic toggle
            // Optionally refetch community to update member count
        } catch (err) {
            console.error("Failed to join/leave:", err);
        } finally {
            setIsJoining(false);
        }
    };

    // --- Effects ---

    useEffect(() => {
        fetchCommunity();
    }, [fetchCommunity]);

    useEffect(() => {
        fetchPosts(true); // Reset and fetch when sort or community changes
    }, [fetchPosts]);


    // --- Render Logic ---

    if (isCommunityLoading) return <Loader />;
    
    // Handle 404 specifically
    if (communityError?.response?.status === 404) {
        return <CommunityNotFound />;
    }
    
    if (communityError) return <ErrorDisplay message="Failed to load community" />;

    return (
        <div className="max-w-4xl mx-auto min-h-screen">
            <Helmet>
                <title>{community?.title || 'Community'} | Readit</title>
                <meta name="description" content={community?.description} />
            </Helmet>
            
            {/* --- Banner Header --- */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Cover Image (Optional - Placeholder for now) */}
                <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 w-full"></div>
                
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-10 mb-4 gap-4">
                        {/* Icon */}
                        <div className="relative">
                            <img 
                                src={community.icon || '/default-community.png'} 
                                alt={community.title} 
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white object-cover" 
                            />
                        </div>
                        
                        {/* Title & Meta */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                                {community.title}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                c/{community.name} • {community.memberCount} Members
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <button 
                                onClick={handleJoinToggle}
                                disabled={isJoining}
                                className={`px-6 py-2 rounded-full font-bold transition-colors border ${
                                    isMember 
                                    ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' 
                                    : 'bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-transparent'
                                }`}
                            >
                                {isJoining ? '...' : isMember ? 'Joined' : 'Join'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Description */}
                    {community.description && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm max-w-2xl">
                            {community.description}
                        </p>
                    )}
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="p-4 md:p-6">
                {/* Create & Sort Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <Link 
                        to={`/readit/c/${communityName}/submit`}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 w-full md:w-auto transition-colors shadow-sm"
                    >
                        <i className="fi fi-rr-plus"></i>
                        <span className="font-medium">Create Post</span>
                    </Link>

                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {['hot', 'new', 'top'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSort(opt)}
                                className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${
                                    sort === opt 
                                    ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Posts Feed --- */}
                <div className="space-y-4 min-h-[500px]">
                    {arePostsLoading ? (
                        <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                        </>
                    ) : posts.length > 0 ? (
                        <motion.div 
                            initial="hidden" 
                            animate="show" 
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                            }}
                        >
                            {posts.map(post => (
                                <ReaditPostCard post={post} key={post._id} />
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">There are no posts here yet.</p>
                            <Link to={`/readit/c/${communityName}/submit`} className="text-orange-500 font-bold hover:underline">
                                Be the first to post!
                            </Link>
                        </div>
                    )}

                    {/* Load More Button */}
                    {hasMore.current && !arePostsLoading && posts.length > 0 && (
                        <button 
                            onClick={fetchMorePosts} 
                            disabled={isFetchingMore}
                            className="w-full py-3 mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-500 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isFetchingMore ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </div>
                            ) : (
                                'Load More Posts'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaditCommunityPage;