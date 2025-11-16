// ── src/pages/blog.page.jsx (Final Integrated Version) ──

import React, { createContext, useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import AnimationWrapper from '../common/page-animation';
import { formatDate, formatReadingTime } from '../common/date';
import BlogInteraction from '../components/blog-interaction.component';
import BlogContent from '../components/blog-content.component';
import CommentsContainer from '../components/comments.component';
import ErrorBoundary from '../components/ErrorBoundary';
import { Helmet } from 'react-helmet-async';
import LazyLoad from 'react-lazyload';

// --- UPDATED IMPORTS ---
import api from '../common/api'; // Centralized API wrapper
import { useSocket } from '../context/SocketContext'; // Centralized socket
import BlogPageSkeleton from '../components/BlogPageSkeleton'; // Your skeleton loader
import ErrorDisplay from '../components/ErrorDisplay'; // Your error component
import ProgressiveImage from '../components/ProgressiveImage'; // Your progressive image
import { fetchComments as fetchCommentsAPI } from '../utils/comment.api'; // Fixed API function
import { userContext } from '../App';

export const postStructure = {
  title: '',
  des: "",
  content: [],
  tags: [],
  authorId: { personal_info: {} },
  banner: '',
  publishedAt: '',
  readingTime: 0,
  activity: { total_likes: 0, total_comments: 0, total_parent_comments: 0, isLikedByUser: false }
};

export const postContext = createContext({});

const BlogPage = () => {
  const { blog_id } = useParams();
  const navigate = useNavigate();
  
  // --- UPDATED: Use centralized socket ---
  const { socket } = useSocket();
  const { userAuth } = useContext(userContext);

  const [blog, setBlog] = useState(postStructure);
  const [similarBlogs, setSimilarBlogs] = useState([]);
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    title,
    des: description,
    content,
    banner,
    authorId: { personal_info: { fullname, username: author_username, profile_img } = {} } = {},
    publishedAt,
    tags = [],
    readingTime,
  } = blog;

  const blogMeta = useMemo(() => ({
    title: `${title} | Your Blog Name`,
    description: description || `${title} - A post by ${fullname}`,
    keywords: tags.join(', '),
    author: fullname,
    url: window.location.href,
    image: banner
  }), [title, description, fullname, tags, banner]);

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

    socket.on('likeUpdate', handleLikeUpdate);
    socket.on('postDeleted', handlePostDeleted);
    
    // Cleanup: leave the room
    return () => {
      socket.off('likeUpdate', handleLikeUpdate);
      socket.off('postDeleted', handlePostDeleted);
    };
  }, [socket, blog_id, updateBlogActivity, navigate]);

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
      <Helmet>
        <title>{blogMeta.title}</title>
        <meta name="description" content={blogMeta.description} />
        <meta name="keywords" content={blogMeta.keywords} />
        <meta name="author" content={blogMeta.author} />
        <meta property="og:title" content={blogMeta.title} />
        <meta property="og:description" content={blogMeta.description} />
        <meta property="og:image" content={blogMeta.image} />
        <meta property="og:url" content={blogMeta.url} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
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
          })}
        </script>
      </Helmet>
      
      <AnimationWrapper>
        <postContext.Provider value={{
          blog,
          setBlog,
          updateBlogActivity,
          commentsWrapper,
          setCommentsWrapper
        }}>
          <Toaster />
          <CommentsContainer />
          
          <article className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <header className="mb-12">
              <LazyLoad height={500} once offset={100}>
                <ProgressiveImage
                  src={banner}
                  placeholder="/placeholder-blog.jpg"
                  className="aspect-video rounded-xl shadow-lg w-full object-cover"
                  alt={title}
                />
              </LazyLoad>

              <div className="mt-12">
                <h1 className="text-4xl font-bold mb-4 text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>

              <div className="flex flex-wrap justify-between items-center my-8 gap-4">
                <div className="flex items-center gap-5">
                  <LazyLoad once offset={100}>
                    <img
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      src={profile_img}
                      alt={fullname}
                      loading="lazy"
                    />
                  </LazyLoad>
                  <div>
                    <p className="font-medium capitalize">
                      {fullname}
                      <br />
                      <Link
                        className="text-twitter hover:underline text-sm font-normal"
                        to={`/user/${author_username}`}
                      >
                        @{author_username}
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-dark-gray opacity-75 flex items-center gap-1">
                    <i className="fi fi-rr-calendar-clock text-base"></i>
                    {formatDate(publishedAt)}
                  </span>
                  <span className="text-dark-gray opacity-75 flex items-center gap-1">
                    <i className="fi fi-rr-book-open-cover text-base"></i>
                    {formatReadingTime(readingTime || 5)}
                  </span>
                </div>
              </div>

              <BlogInteraction />
            </header>

            <section className="my-12 font-gelasio blog-page-content prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-accent hover:prose-a:text-accent-dark prose-img:rounded-xl prose-img:shadow-md">
              {content[0]?.blocks?.map((block, i) => (
                <div className="my-4 md:my-8" key={i}>
                  <BlogContent block={block} />
                </div>
              ))}
            </section>

            <footer className="mt-16">
              <BlogInteraction />
              
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Blogs */}
              {similarBlogs.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6">Similar Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {similarBlogs.map(similarBlog => (
                      <div key={similarBlog._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-lg mb-2">{similarBlog.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{similarBlog.des}</p>
                        <Link
                          to={`/blog/${similarBlog.blog_id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Read more
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </footer>
          </article>
        </postContext.Provider>
      </AnimationWrapper>
    </ErrorBoundary>
  );
};

export default React.memo(BlogPage);