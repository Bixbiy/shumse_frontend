// ── src/pages/HomePage.jsx ──
// Mobile-first refactored with Modern Slate design system

import React, { useEffect, useState, useCallback } from 'react';
import { throttle } from 'lodash';
import { motion } from 'framer-motion';

import { useSocket } from '../context/SocketContext';
import api from "../common/api";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from '../components/InPageNavigation';
import Loader from "../components/Loader";
import PostCard from '../components/BlogPost';
import MinimalPostCard from '../components/NoBannerBlogPost';
import NoDATA from '../components/NoData';
import AdSection from '../components/AdSection';
import SEO from "../common/seo";
import PostCardSkeleton from '../components/PostCardSkeleton';
import MinimalPostCardSkeleton from '../components/MinimalPostCardSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

// Helper Functions
const updateBlogLikes = (state, blog_id, total_likes) => {
    if (!state) return null;
    const results = state.results ? state.results : state;
    const updatedResults = results.map(blog =>
        blog.blog_id === blog_id
            ? { ...blog, activity: { ...blog.activity, total_likes } }
            : blog
    );
    return state.results ? { ...state, results: updatedResults } : updatedResults;
};

const filterOutBlog = (state, blog_id) => {
    if (!state) return null;
    const results = state.results ? state.results : state;
    const updatedResults = results.filter(blog => blog.blog_id !== blog_id);
    return state.results ? { ...state, results: updatedResults } : updatedResults;
};

const HomePage = () => {
    const [blogs, setBlogs] = useState(null);
    const [trendingBlogs, setTrendingBlogs] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pageTitle, setPageTitle] = useState("Home");
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const { socket } = useSocket();

    const fetchBlogs = useCallback(async (category, page = 1) => {
        setLoading(true);
        if (page === 1) setError(null);

        const isNewCategory = (category !== selectedCategory);
        const currentPage = isNewCategory ? 1 : page;
        let endpoint = category ? '/category-find' : '/latest-posts';
        let payload = { page: currentPage };
        if (category) payload.tag = category;

        try {
            const { data } = await api.post(endpoint, payload);
            const { blogs: newBlogs, totalDocs } = data;

            setBlogs(prev => {
                if (isNewCategory || currentPage === 1) {
                    return { results: newBlogs, page: 1, totalDocs };
                } else {
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
    }, [selectedCategory]);

    const fetchTrendingPosts = useCallback(async () => {
        try {
            const { data } = await api.get('/trending-posts');
            setTrendingBlogs(data.trendingPosts);
        } catch (err) {
            console.error("Error fetching trending posts:", err);
        }
    }, []);

    const loadPostByCat = (e) => {
        const category = e.target.innerText.trim();
        if (selectedCategory === category) {
            setBlogs(null);
            fetchBlogs(null, 1);
        } else {
            setBlogs(null);
            fetchBlogs(category, 1);
        }
    };

    useEffect(() => {
        fetchBlogs(null, 1);
        fetchTrendingPosts();
    }, [fetchBlogs, fetchTrendingPosts]);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 150;

            if (atBottom && !loading && hasMore && blogs) {
                fetchBlogs(pageTitle === "Home" ? null : pageTitle, blogs.page + 1);
            }
        };

        const throttledScrollHandler = throttle(handleScroll, 300);
        window.addEventListener('scroll', throttledScrollHandler);
        return () => window.removeEventListener('scroll', throttledScrollHandler);
    }, [blogs, loading, hasMore, pageTitle, fetchBlogs]);

    useEffect(() => {
        if (!socket) return;

        socket.on('listLikeUpdate', ({ blog_id, total_likes }) => {
            setBlogs(prev => updateBlogLikes(prev, blog_id, total_likes));
            setTrendingBlogs(prev => updateBlogLikes(prev, blog_id, total_likes));
        });

        socket.on('newPost', (newPost) => {
            if (pageTitle === "Home") {
                setBlogs(prev => ({ ...prev, results: [newPost, ...prev.results] }));
            }
        });

        socket.on('postDeleted', ({ blog_id }) => {
            setBlogs(prev => filterOutBlog(prev, blog_id));
            setTrendingBlogs(prev => filterOutBlog(prev, blog_id));
        });

        return () => {
            socket.off('listLikeUpdate');
            socket.off('newPost');
            socket.off('postDeleted');
        };
    }, [socket, pageTitle]);

    const Categories = ["Technology", "Science", "Health", "Business", "Entertainment", "Sports", "Travel", "Lifestyle", "Fashion", "Food", "Education", "Politics", "Environment", "Art", "Music", "Movies", "Books", "Gaming", "History"];

    if (!blogs && !loading && error) {
        return <ErrorDisplay message={error} onRetry={() => fetchBlogs(selectedCategory, 1)} />;
    }

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Shums",
        "url": "https://shums.com",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://shums.com/search/{search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <AnimationWrapper>
            <SEO
                title={pageTitle === "Home" ? "Home" : `${pageTitle} Blogs`}
                schema={websiteSchema}
            />

            {/* Mobile-First Container */}
            <section className="min-h-screen px-4 md:px-6 lg:px-8 pt-6 pb-20 md:pb-6 max-w-screen-2xl mx-auto">

                {/* Mobile Category Horizontal Scroll */}
                <div className="md:hidden mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-2 min-w-max pb-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setBlogs(null);
                                fetchBlogs(null, 1);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                }`}
                        >
                            All
                        </motion.button>
                        {Categories.slice(0, 12).map((category, i) => (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={loadPostByCat}
                                key={i}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                    }`}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Main Grid: Mobile 1 col, Desktop 2 cols (70/30) */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">

                    {/* Left: Blog Feed */}
                    <div className="w-full">
                        <InPageNavigation key={pageTitle} routes={[pageTitle, "Trending Posts"]} defaultHidden={["Trending Posts"]}>

                            {/* Tab 1: Latest/Category Posts */}
                            <div id="blog-section" className="space-y-6">
                                {
                                    blogs === null ? (
                                        [...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)
                                    ) : (
                                        blogs.results.length ?
                                            blogs.results.map((blog, i) => (
                                                <React.Fragment key={i}>
                                                    <AnimationWrapper transition={{ duration: 0.5, delay: i * 0.05 }}>
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
                            <div className="space-y-4">
                                {
                                    trendingBlogs === null ? (
                                        [...Array(5)].map((_, i) => <MinimalPostCardSkeleton key={i} />)
                                    ) : (
                                        trendingBlogs.length ?
                                            trendingBlogs.map((blog, i) => (
                                                <AnimationWrapper transition={{ duration: 0.5, delay: i * 0.05 }} key={i}>
                                                    <MinimalPostCard blog={blog} index={i} />
                                                </AnimationWrapper>
                                            ))
                                            : <NoDATA />
                                    )
                                }
                            </div>
                        </InPageNavigation>
                    </div>

                    {/* Right: Sidebar (Hidden on Mobile) */}
                    <aside className="hidden lg:block sticky top-24 h-fit">
                        <div className="space-y-8">

                            {/* Categories */}
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                                    <i className="fi fi-rr-apps text-primary"></i>
                                    Categories
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {Categories.map((category, i) => (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={loadPostByCat}
                                            key={i}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                                                ? "bg-primary text-white shadow-md"
                                                : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                                }`}
                                        >
                                            {category}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Trending Sidebar */}
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                                    <i className="fi fi-rs-arrow-trend-up text-primary"></i>
                                    Trending
                                </h2>
                                <div className="space-y-4">
                                    {
                                        trendingBlogs === null ? (
                                            [...Array(3)].map((_, i) => <MinimalPostCardSkeleton key={i} />)
                                        ) : (
                                            trendingBlogs.length ?
                                                trendingBlogs.slice(0, 3).map((blog, i) => (
                                                    <AnimationWrapper transition={{ duration: 0.5, delay: i * 0.05 }} key={i}>
                                                        <MinimalPostCard blog={blog} index={i} />
                                                    </AnimationWrapper>
                                                ))
                                                : <NoDATA />
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default HomePage;