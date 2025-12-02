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
    authorId: { personal_info: { fullname, username: author_username, profile_img } = {} } = {},
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
            <header className="mb-12">
              <ProgressiveImage
                src={banner}
                placeholder="/placeholder-blog.jpg"
                className="aspect-video rounded-xl shadow-lg w-full object-cover"
                alt={title}
              />

              <div className="mt-12">
                <h1 className="text-4xl font-bold mb-4 text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>

              <div className="flex flex-wrap justify-between items-center my-8 gap-4">
                <div className="flex items-center gap-5">
                  <img
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    src={profile_img}
                    alt={fullname}
                    loading="lazy"
                  />
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