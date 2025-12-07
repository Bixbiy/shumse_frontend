import React, { useEffect, useState, useCallback, useMemo, createContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import api from "../common/api";
import { useSocket } from "../context/SocketContext";
import { fetchCommentsAPI } from "../common/api";
import BlogInteraction from "../components/BlogInteraction";
import BlogContent from "../components/BlogContent";
import Comments from "../components/Comments";
import BlogPageSkeleton from "../components/BlogPageSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import ErrorBoundary from "../components/ErrorBoundary";
import ProgressiveImage from "../components/ProgressiveImage";
import SEO from "../common/seo";
import VerificationBadge from "../components/VerificationBadge";

export const postContext = createContext({});

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatReadingTime = (minutes) => {
  return `${minutes} min read`;
};

const CommentsContainer = () => {
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  return (
    <postContext.Provider value={{ commentsWrapper, setCommentsWrapper }}>
      {commentsWrapper && <Comments />}
    </postContext.Provider>
  );
};

const BlogPage = () => {
  const { blog_id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [blog, setBlog] = useState({
    title: '',
    des: '',
    content: [],
    banner: '',
    authorId: {},
    tags: [],
    activity: {},
    publishedAt: '',
    readingTime: 5
  });
  const [similarBlogs, setSimilarBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsWrapper, setCommentsWrapper] = useState(false);

  const {
    title,
    des: description,
    content,
    banner,
    authorId: { personal_info: { fullname, username: author_username, profile_img, isVerified } = {} } = {},
    publishedAt,
    tags = [],
    readingTime,
  } = blog;

  // Core data-loading function with centralized API
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch the main blog post using centralized API
      const { data: { blog: blogData } } = await api.post('/get-post', { blog_id });

      // 2. Fetch comments and similar posts in parallel
      const [commentsResult, similarData] = await Promise.allSettled([
        fetchCommentsAPI(blogData._id),
        blogData.tags?.length ? api.post(
          `/similar/posts`,
          { tag: blogData.tags[0], blog_id }
        ) : Promise.resolve({ data: [] })
      ]);

      // 3. Process the results
      const comments = commentsResult.status === 'fulfilled' ? commentsResult.value.comments : [];
      const total_comments = commentsResult.status === 'fulfilled' ? commentsResult.value.total : 0;

      // 4. Set all data in one go
      setBlog({
        ...blogData,
        comments: comments,
        activity: {
          ...blogData.activity,
          total_comments: total_comments,
          total_parent_comments: total_comments,
          isLikedByUser: blogData.activity.isLikedByUser || false
        }
      });

      if (similarData.status === 'fulfilled' && similarData.value.data) {
        setSimilarBlogs(similarData.value.data);
      }

    } catch (err) {
      console.error('Error fetching blog post:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load blog post';
      setError(errorMessage);

      if (err.response?.status === 404) {
        navigate('/404', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [blog_id, navigate]);

  const updateBlogActivity = useCallback((updates) => {
    setBlog(prev => ({
      ...prev,
      activity: { ...prev.activity, ...updates }
    }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // --- Real-time Socket Listeners ---
  useEffect(() => {
    if (!socket || !blog_id) return;

    // Join the room for this post
    socket.emit('joinPostRoom', { blog_id });

    const handleLikeUpdate = (data) => {
      if (data.blog_id === blog_id) {
        updateBlogActivity({ total_likes: data.total_likes });
      }
    };

    const handlePostDeleted = (data) => {
      if (data.blog_id === blog_id) {
        toast.error("This post has been deleted by the author.");
        navigate('/');
      }
    };

    // --- New Comment Listeners ---
    const handleNewComment = (data) => {
      if (data.blog_id === blog_id) {
        updateBlogActivity({
          total_comments: (blog.activity.total_comments || 0) + 1,
          total_parent_comments: (blog.activity.total_parent_comments || 0) + 1
        });
      }
    };

    const handleNewReply = (data) => {
      if (data.blog_id === blog_id) {
        updateBlogActivity({
          total_comments: (blog.activity.total_comments || 0) + 1
        });
      }
    };

    const handleCommentDeleted = (data) => {
      if (data.blog_id === blog_id) {
        updateBlogActivity({
          total_comments: Math.max(0, (blog.activity.total_comments || 1) - 1),
          total_parent_comments: data.isReply ? blog.activity.total_parent_comments : Math.max(0, (blog.activity.total_parent_comments || 1) - 1)
        });
      }
    };

    socket.on('likeUpdate', handleLikeUpdate);
    socket.on('postDeleted', handlePostDeleted);
    socket.on('newComment', handleNewComment);
    socket.on('newReply', handleNewReply);
    socket.on('commentDeleted', handleCommentDeleted);

    // Cleanup: leave the room
    return () => {
      socket.off('likeUpdate', handleLikeUpdate);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('newComment', handleNewComment);
      socket.off('newReply', handleNewReply);
      socket.off('commentDeleted', handleCommentDeleted);
    };
  }, [socket, blog_id, updateBlogActivity, navigate, blog.activity]);

  // Reading Progress Hook
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setReadingProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
      }
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  // Render logic
  if (loading) {
    return <BlogPageSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
        <ErrorDisplay message={error} onRetry={fetchPost} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SEO
        title={title}
        description={description || `${title} - A post by ${fullname}`}
        image={banner}
        type="article"
        schema={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": title,
          "description": description,
          "image": banner,
          "author": {
            "@type": "Person",
            "name": fullname
          },
          "datePublished": publishedAt,
          "timeRequired": `PT${readingTime}M`,
          "wordCount": content[0]?.blocks?.reduce((acc, block) => acc + (block.data?.text?.split(' ').length || 0), 0) || 0
        }}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-primary to-rose-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <AnimationWrapper>
        <postContext.Provider value={{
          blog,
          setBlog,
          updateBlogActivity,
          commentsWrapper,
          setCommentsWrapper
        }}>
          <Toaster />
          {commentsWrapper && <Comments />}

          <article className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <header className="mb-12 relative">
              {/* Hero Banner with slight parallax feeling or shadow */}
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-8 group">
                <ProgressiveImage
                  src={banner}
                  placeholder="/placeholder-blog.jpg"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={title}
                />
                {/* Overlay gradient for better text visibility if we want to put text on top, but keeping it clean for now */}
              </div>

              <div className="space-y-6">
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
                  {title}
                </h1>

                {/* Author & Meta - Mobile Optimized */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-y border-gray-100 dark:border-gray-800 py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-900 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800"
                        src={profile_img}
                        alt={fullname}
                        loading="lazy"
                      />
                      {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm">
                          <VerificationBadge size={14} />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold capitalize text-lg text-gray-900 dark:text-gray-100 leading-none mb-1 flex items-center gap-2">
                        {fullname}
                        {isVerified && <VerificationBadge size={16} />}
                      </p>
                      <Link
                        className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium"
                        to={`/user/${author_username}`}
                      >
                        @{author_username}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full">
                      <i className="fi fi-rr-calendar text-base"></i>
                      {formatDate(publishedAt)}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full">
                      <i className="fi fi-rr-time-fast text-base"></i>
                      {formatReadingTime(readingTime || 5)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop interaction bar */}
              <div className="mt-8 hidden md:block">
                <BlogInteraction />
              </div>
            </header>

            {/* Content with better typography */}
            <section className="font-gelasio blog-page-content prose prose-lg max-w-none dark:prose-invert 
                prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-8
                prose-a:text-primary hover:prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/30 prose-blockquote:py-2 prose-blockquote:not-italic
                selection:bg-primary/20 selection:text-primary-900
            ">
              {content[0]?.blocks?.map((block, i) => (
                <div key={i} className="my-2 transition-opacity duration-500">
                  <BlogContent block={block} />
                </div>
              ))}
            </section>

            <footer className="mt-20 border-t border-gray-100 dark:border-gray-800 pt-10">
              <BlogInteraction />

              {/* Enhanced Tags */}
              {tags.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Filed Under</h3>
                  <div className="flex flex-wrap gap-3">
                    {tags.map((tag, index) => (
                      <Link
                        to={`/search/tags/${tag}`} // improved link
                        key={index}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-0.5"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Similar Blogs */}
              {similarBlogs.length > 0 && (
                <div className="mt-16">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold">More like this</h3>
                    <Link to="/" className="text-primary text-sm font-medium hover:underline">View all</Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {similarBlogs.map(similarBlog => (
                      <div key={similarBlog._id} className="group cursor-pointer">
                        <Link to={`/post/${similarBlog.blog_id}`} className="block">
                          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-gray-100">
                            <img
                              src={similarBlog.banner}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt={similarBlog.title}
                              loading="lazy"
                            />
                          </div>
                          <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {similarBlog.title}
                          </h4>
                          <p className="text-gray-500 text-sm line-clamp-2">
                            {similarBlog.des}
                          </p>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </footer>

            {/* Mobile Floating Action Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 z-40 animate-slide-up-fade">
              <BlogInteraction small />
            </div>

          </article>
        </postContext.Provider>
      </AnimationWrapper>
    </ErrorBoundary>
  );
};

export default React.memo(BlogPage);