// ── src/pages/HomePage.jsx ──
// Fully refactored for performance, error handling, and real-time updates.

import React, { useEffect, useState, useCallback, useContext } from 'react';
import { throttle } from 'lodash';


import { useSocket } from '../context/SocketContext'; // Import the custom hook
import api from "../common/api"; // Import the new API instance
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from '../components/inpage-navigation.component';
import Loader from "../components/loader.component";
import PostCard from '../components/blog-post.component';
import MinimalPostCard from '../components/nobanner-blog-post.component';
import NoDATA from '../components/nodata.component';
import AdSection from '../components/AdSection'; 

// --- New Components for UI/UX ---
import PostCardSkeleton from '../components/PostCardSkeleton';
import MinimalPostCardSkeleton from '../components/MinimalPostCardSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

// --- Helper Functions for Live Updates ---
const updateBlogLikes = (state, blog_id, total_likes) => {
    if (!state) return null;
    
    // Check if it's the 'blogs' object or 'trendingBlogs' array
    const results = state.results ? state.results : state;

    const updatedResults = results.map(blog => {
        if (blog.blog_id === blog_id) {
            return { ...blog, activity: { ...blog.activity, total_likes } };
        }
        return blog;
    });

    return state.results ? { ...state, results: updatedResults } : updatedResults;
};

const filterOutBlog = (state, blog_id) => {
    if (!state) return null;
    
    const results = state.results ? state.results : state;
    const updatedResults = results.filter(blog => blog.blog_id !== blog_id);

    return state.results ? { ...state, results: updatedResults } : updatedResults;
};

// --- HomePage Component ---
const HomePage = () => {
    const [blogs, setBlogs] = useState(null); // { results: [], page: 1, totalDocs: 0 }
    const [trendingBlogs, setTrendingBlogs] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pageTitle, setPageTitle] = useState("Home");
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null); // For error handling
    
    const { socket } = useSocket(); // Get socket from context

    // 1. REFACTORED: Central blog fetching function
    const fetchBlogs = useCallback(async (category, page = 1) => {
        setLoading(true);
        if (page === 1) {
            setError(null); // Clear error on a new load
        }

        const isNewCategory = (category !== selectedCategory);
        const currentPage = isNewCategory ? 1 : page;

        // Setup API call
        let endpoint = category ? '/category-find' : '/latest-posts';
        let payload = { page: currentPage };
        if (category) payload.tag = category;

        try {
            // FIX (N+1): Call the new 'api' instance.
            // It now returns { blogs, totalDocs } in ONE request.
            const { data } = await api.post(endpoint, payload);
            const { blogs: newBlogs, totalDocs } = data;

            // FIX: Pagination logic is now simple and inside the component
            setBlogs(prev => {
                if (isNewCategory || currentPage === 1) {
                    return { results: newBlogs, page: 1, totalDocs };
                } else {
                    // Append new blogs
                    return {
                        ...prev,
                        results: [...prev.results, ...newBlogs],
                        page: currentPage,
                    };
                }
            });
            
            setHasMore(currentPage * 5 < totalDocs);
            setPageTitle(category || "Home");
            setSelectedCategory(category);
            
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Failed to load posts. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]); // Add selectedCategory as dependency

    // 2. REFACTORED: Fetch trending posts with error handling
    const fetchTrendingPosts = useCallback(async () => {
        try {
            const { data } = await api.get('/trending-posts');
            setTrendingBlogs(data.trendingPosts);
        } catch (err) {
            console.error("Error fetching trending posts:", err);
            // Non-critical, so we don't set a page-wide error
        }
    }, []);

    // 3. REFACTORED: Category click handler
    const loadPostByCat = (e) => {
        const category = e.target.innerText;
        
        if (selectedCategory === category) {
            // Clicked active category, reset to Home
            setBlogs(null); // Show skeleton
            fetchBlogs(null, 1);
        } else {
            // Clicked new category
            setBlogs(null); // Show skeleton
            fetchBlogs(category, 1);
        }
    };
    
    // 4. FIX (Double Fetch): Simplified initial load effect
    useEffect(() => {
        fetchBlogs(null, 1); // Fetch initial posts (Home)
        fetchTrendingPosts();
    }, []); // Eslint prefers this

    // 5. REFACTORED (Performance): Throttled infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 150;

            if (atBottom && !loading && hasMore && blogs) {
                if (pageTitle === "Home") {
                    fetchBlogs(null, blogs.page + 1);
                } else {
                    fetchBlogs(pageTitle, blogs.page + 1);
                }
            }
        };

        // Add throttle
        const throttledScrollHandler = throttle(handleScroll, 300);
        window.addEventListener('scroll', throttledScrollHandler);
        
        return () => window.removeEventListener('scroll', throttledScrollHandler);
    }, [blogs, loading, hasMore, pageTitle, fetchBlogs]);

    // 6. NEW (Advanced): Socket.io listeners for real-time updates
    useEffect(() => {
        if (!socket) return; // Wait for socket connection

        // Listen for like updates
        socket.on('listLikeUpdate', ({ blog_id, total_likes }) => {
            setBlogs(prev => updateBlogLikes(prev, blog_id, total_likes));
            setTrendingBlogs(prev => updateBlogLikes(prev, blog_id, total_likes));
        });

        // Listen for new posts
        socket.on('newPost', (newPost) => {
            // Only add to "Home" feed
            if (pageTitle === "Home") {
                setBlogs(prev => ({
                    ...prev,
                    results: [newPost, ...prev.results]
                }));
            }
        });

        // Listen for deleted posts
        socket.on('postDeleted', ({ blog_id }) => {
            setBlogs(prev => filterOutBlog(prev, blog_id));
            setTrendingBlogs(prev => filterOutBlog(prev, blog_id));
        });

        // Clean up listeners
        return () => {
            socket.off('listLikeUpdate');
            socket.off('newPost');
            socket.off('postDeleted');
        };
    }, [socket, pageTitle]);

    const Categories = ["Technology", "Science", "Health", "Business", "Entertainment", "Sports", "Travel", "Lifestyle", "Fashion", "Food", "Education", "Politics", "Environment", "Art", "Music", "Movies", "Books", "Gaming", "History"];

    // --- Render Logic ---

    // Show main error state
    if (!blogs && !loading && error) {
        return <ErrorDisplay message={error} onRetry={() => fetchBlogs(selectedCategory, 1)} />;
    }

    return (
        <AnimationWrapper>
            <section className="min-h-screen flex gap-10 pt-6">
                {/* Left Section - Blog Posts */}
                <div className="w-full">
                    <InPageNavigation key={pageTitle} routes={[pageTitle, "Trending Posts"]} defaultHidden={["Trending Posts"]}>
                        
                        {/* Tab 1: Latest/Category Posts */}
                        <div id="blog-section" className="pt-4">
                            {
                                // Show skeletons on first load or category change
                                blogs === null ? (
                                    [...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)
                                ) : (
                                    blogs.results.length ?
                                        blogs.results.map((blog, i) => (
                                            <React.Fragment key={i}>
                                                <AnimationWrapper transition={{ duration: 1, delay: i * 0.1 }}>
                                                    {/* Pass author object directly, PostCard handles it */}
                                                    <PostCard content={blog} author={blog.authorId} /> 
                                                </AnimationWrapper>
                                                {(i + 1) % 3 === 0 && <AdSection key={`ad-${i}`} />}
                                            </React.Fragment>
                                        ))
                                    : <NoDATA />
                                )
                            }
                            {loading && <div className="flex justify-center items-center w-full h-20"><Loader /></div>}
                        </div>
                        
                        {/* Tab 2: Trending Posts */}
                        <div className="pt-4">
                            {
                                trendingBlogs === null ? (
                                    [...Array(5)].map((_, i) => <MinimalPostCardSkeleton key={i} />)
                                ) : (
                                    trendingBlogs.length ?
                                        trendingBlogs.map((blog, i) => (
                                            <AnimationWrapper transition={{ duration: 1, delay: i * 0.1 }} key={i}>
                                                <MinimalPostCard blog={blog} index={i} />
                                            </AnimationWrapper>
                                        ))
                                    : <NoDATA />
                                )
                            }
                        </div>
                    </InPageNavigation>
                </div>

                {/* Right Section - Filters & Trending Blogs */}
                <div className="min-w-[350px] lg:min-w-[400px] max-w-[400px] flex-shrink-0 pl-8 pt-3 hidden md:block transition-all duration-500">
                    <div className="flex flex-col gap-5">
                        <h1 className="font-medium text-xl mb-4">Suggested Categories</h1>
                        <div className="flex flex-wrap gap-2">
                            {Categories.map((category, i) => (
                                <button
                                    onClick={loadPostByCat}
                                    key={i}
                                    className={`btn-light text-black font-roboto font-light py-2 px-4 transition-all duration-300 bg-white text-black dark:bg-[#18181b] dark:text-white ${
                                        selectedCategory === category 
                                        ? "bg-black dark:bg-white dark:text-dark scale-105 shadow-lg" 
                                        : "hover:bg-gray-200"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rs-arrow-trend-up text-xl"></i></h1>
                            {
                                // Re-use the same skeleton/data logic
                                trendingBlogs === null ? (
                                    [...Array(3)].map((_, i) => <MinimalPostCardSkeleton key={i} />)
                                ) : (
                                    trendingBlogs.length ?
                                        // Show top 3
                                        trendingBlogs.slice(0, 3).map((blog, i) => (
                                            <AnimationWrapper transition={{ duration: 1, delay: i * 0.1 }} key={i}>
                                                <MinimalPostCard blog={blog} index={i} />
                                            </AnimationWrapper>
                                        ))
                                    : <NoDATA />
                                )
                            }
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default HomePage;