/*
 * PATH: src/pages/ReaditCommunityPage.jsx  
 * Enhanced with banner and status badges
 */
import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserContext } from '../App';
import axiosInstance from '../common/api';
import Loader from '../components/Loader';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useReadit } from '../hooks/useReadit';
import CommunityStatusBadge from '../components/readit/CommunityStatusBadge'; // NEW
import CommunityBanner from '../components/readit/CommunityBanner'; // NEW

// --- SKELETON COMPONENT ---
const PostCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 shadow-sm border border-gray-200 dark:border-slate-800 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-20 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
    </div>
);

const ErrorDisplay = ({ message = "An error occurred" }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
            <i className="fi fi-rr-exclamation text-3xl text-red-500"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{message}</h3>
        <Link to="/readit" className="mt-4 text-indigo-500 hover:underline">Return to Home</Link>
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
    const { userAuth } = useContext(UserContext);

    // State for community data
    const [community, setCommunity] = useState(null);
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);
    const [communityError, setCommunityError] = useState(null);
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    // Use Custom Hook for Posts
    const {
        posts,
        isLoading: arePostsLoading,
        isFetchingMore,
        hasMore,
        sort,
        setSort,
        loadMore
    } = useReadit('hot', communityName);

    // --- 1. Fetch Community Details ---
    const fetchCommunity = useCallback(async () => {
        setIsCommunityLoading(true);
        setCommunityError(null);
        try {
            const { data } = await axiosInstance.get(`/readit/c/${communityName}`);
            setCommunity(data);
            // Check if user is member
            if (userAuth?.access_token && data.members) {
                setIsMember(data.members.includes(userAuth._id));
            }
        } catch (err) {
            console.error("Failed to fetch community:", err);
            setCommunityError(err.response?.status === 404 ? 'not_found' : 'error');
        } finally {
            setIsCommunityLoading(false);
        }
    }, [communityName, userAuth]);

    useEffect(() => {
        fetchCommunity();
    }, [fetchCommunity]);

    // --- 2. Join/Leave Community ---
    const handleJoinToggle = async () => {
        if (!userAuth?.access_token) {
            return window.location.href = '/signin';
        }

        setIsJoining(true);
        try {
            await axiosInstance.post(`/readit/c/${communityName}/join`);
            setIsMember(!isMember);
            // Update memberCount optimistically
            setCommunity(prev => ({
                ...prev,
                memberCount: prev.memberCount + (isMember ? -1 : 1)
            }));
        } catch (err) {
            console.error("Failed to join/leave:", err);
        } finally {
            setIsJoining(false);
        }
    };

    // --- 3. Loading State ---
    if (isCommunityLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    // --- 4. Error States ---
    if (communityError === 'not_found') return <CommunityNotFound />;
    if (communityError) return <ErrorDisplay message="Failed to load community" />;
    if (!community) return <ErrorDisplay message="Community data unavailable" />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Helmet>
                <title>{community.title} (c/{community.name}) | Readit</title>
                <meta name="description" content={community.description || community.metaDescription || `Join c/${community.name} - ${community.title}`} />
                {community.keywords && (
                    <meta name="keywords" content={community.keywords.join(', ')} />
                )}
            </Helmet>

            {/* Banner Section - NEW */}
            <CommunityBanner
                banner={community.banner}
                communityName={community.name}
            />

            {/* Community Header */}
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 -mt-8 relative z-10"
                >
                    <div className="flex items-start gap-4">
                        {/* Community Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                {community.icon ? (
                                    <img
                                        src={community.icon}
                                        alt={community.name}
                                        className="w-full h-full rounded-xl object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {community.name[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Community Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {community.title}
                                </h1>
                                {/* Status Badge - NEW */}
                                <CommunityStatusBadge status={community.status} />
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                                c/{community.name}
                            </p>

                            {community.description && (
                                <p className="text-gray-700 dark:text-gray-300 mt-3">
                                    {community.description}
                                </p>
                            )}

                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <i className="fi fi-rr-users"></i>
                                    <span className="font-medium">{community.memberCount?.toLocaleString() || 0} members</span>
                                </div>
                                {community.postCount !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                        <i className="fi fi-rr-document"></i>
                                        <span className="font-medium">{community.postCount?.toLocaleString()} posts</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Join Button */}
                        <button
                            onClick={handleJoinToggle}
                            disabled={isJoining}
                            className={`px-6 py-2.5 rounded-full font-bold transition-all ${isMember
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isJoining ? 'Loading...' : isMember ? 'Joined' : 'Join'}
                        </button>
                    </div>

                    {/* Create Post Button */}
                    <Link
                        to={`/readit/c/${community.name}/submit`}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg"
                    >
                        <i className="fi fi-rr-edit"></i>
                        Create Post
                    </Link>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Posts Feed */}
                    <div className="lg:col-span-2">
                        {/* Sort Options */}
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
                            {['hot', 'new', 'top'].map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSort(option)}
                                    className={`px-4 py-2 rounded-full font-medium capitalize transition-all whitespace-nowrap ${sort === option
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Posts List */}
                        <div className="space-y-4">
                            {arePostsLoading ? (
                                Array(5).fill(0).map((_, i) => <PostCardSkeleton key={i} />)
                            ) : posts.length === 0 ? (
                                <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800">
                                    <i className="fi fi-rr-document text-5xl text-gray-300 dark:text-gray-700 mb-4"></i>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to post in this community!</p>
                                    <Link
                                        to={`/readit/c/${community.name}/submit`}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                                    >
                                        <i className="fi fi-rr-edit"></i>
                                        Create First Post
                                    </Link>
                                </div>
                            ) : (
                                posts.map(post => <ReaditPostCard key={post._id} post={post} />)
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={isFetchingMore}
                                    className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isFetchingMore ? 'Loading...' : 'Load More Posts'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 sticky top-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">About Community</h3>

                            {community.description && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                                    {community.description}
                                </p>
                            )}

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">Members</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{community.memberCount?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">Posts</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{community.postCount?.toLocaleString() || 0}</span>
                                </div>
                                {community.createdAt && (
                                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500 dark:text-gray-400">Created</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {new Date(community.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaditCommunityPage;
