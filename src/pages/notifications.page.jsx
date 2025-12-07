import {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../App";
import { useSocket } from "../context/SocketContext";
import api from "../common/api";
import { FaHeart, FaCommentAlt, FaReply, FaTrash, FaCheckDouble } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BsCheck2All, BsThreeDots } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { debounce } from "lodash";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";
import ErrorDisplay from "../components/ErrorDisplay";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'like', 'comment', 'reply'

  const {
    userAuth,
    userAuth: { _id: user_id },
  } = useContext(UserContext);
  const { socket } = useSocket();
  const navigate = useNavigate();

  // 🚀 Fixed pagination with proper ref
  const [bottomRef, inView] = useInView({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px'
  });

  // 🚀 Refs for performance
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // 🎯 Utility functions
  const truncateText = useCallback((text, maxLength = 100) => {
    if (!text) return "";
    const cleanedText = text.replace(/[#*`~>]/g, '').trim();
    return cleanedText.length <= maxLength
      ? cleanedText
      : `${cleanedText.substring(0, maxLength)}...`;
  }, []);

  const formatTimeAgo = useCallback((date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  const generateLink = useCallback((notif) => {
    try {
      if (notif.blog) {
        const base = `/post/${notif.blog.blog_id || notif.blog._id || notif.blogSlug}`;

        if ((notif.type === "comment_like" || notif.type === "comment" || notif.type === "reply") && notif.comment) {
          return `${base}#comment-${notif.comment._id}`;
        }
        return base;
      }
    } catch (e) {
      console.warn("Link generation error:", e);
    }
    return "#";
  }, []);

  // 🚀 Fixed notification fetcher with proper pagination
  const fetchNotifications = useMemo(() => {
    const _fetchNotifications = async (pageNum, isRetry = false) => {
      if (loadingRef.current && !isRetry) return;

      setLoading(true);
      setError(null);

      try {
        const { data } = await api.post("/notifications", {
          page: pageNum,
          limit: 15,
          filter_type: filter !== 'all' ? filter : undefined // Support server-side filtering if API supports it, otherwise client-side
        });

        const newNotifications = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications(prev => {
          if (pageNum === 1) {
            return newNotifications;
          } else {
            // 🚀 Remove duplicates based on _id
            const combined = [...prev, ...newNotifications];
            const uniqueMap = new Map();
            combined.forEach(notif => {
              if (notif._id && !uniqueMap.has(notif._id)) {
                uniqueMap.set(notif._id, notif);
              }
            });
            return Array.from(uniqueMap.values());
          }
        });

        setHasMore(data.hasMore !== false && newNotifications.length > 0);

        // 🚀 Update unread count
        if (pageNum === 1) {
          // If the API returns unread count, use it. Otherwise calculate from current batch (approx)
          // Ideally API should return total unread count
          const unread = newNotifications.filter(n => !n.seen).length;
          setUnreadCount(unread);
        }

      } catch (err) {
        console.error("❌ Notification fetch error:", err);
        const errorMessage = err.response?.data?.error || "Failed to load notifications";
        setError(errorMessage);

        if (!isRetry) {
          toast.error("Couldn't load notifications");
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    return debounce(_fetchNotifications, 300);
  }, [filter]); // Re-create fetcher when filter changes

  // 🚀 Fixed initial load - only load page 1
  useEffect(() => {
    if (userAuth.access_token) {
      setPage(1);
      setNotifications([]);
      setHasMore(true);
      setInitialLoading(true);
      fetchNotifications(1);
    }
  }, [userAuth.access_token, fetchNotifications, filter]);

  // 🚀 Fixed infinite scroll - only load next page when conditions are met
  useEffect(() => {
    if (inView && !loading && hasMore) {
      const nextPage = pageRef.current + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [inView, loading, hasMore, fetchNotifications]);

  // 🚀 Enhanced real-time socket integration
  useEffect(() => {
    if (socket && user_id) {
      const handleNewNotification = (newNotif) => {
        const username = newNotif.user?.username || newNotif.actorUsername || "Someone";

        // Smart notifications based on type
        const notificationTypes = {
          like: `❤️ ${username} liked your post`,
          comment: `💬 ${username} commented: "${truncateText(newNotif.extractedContent, 50)}"`,
          reply: `↩️ ${username} replied: "${truncateText(newNotif.extractedContent, 50)}"`,
          comment_like: `👍 ${username} liked your comment`
        };

        toast.success(notificationTypes[newNotif.type] || `🔔 New notification from ${username}`);

        // Add to top of list if it matches current filter
        setNotifications(prev => {
          if (filter !== 'all' && newNotif.type !== filter) return prev;
          if (prev.find(n => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });

        // Update unread count
        setUnreadCount(prev => prev + 1);
      };

      socket.on("new_notification", handleNewNotification);
      socket.emit("joinNotificationRoom", { userId: user_id });

      return () => {
        socket.off("new_notification", handleNewNotification);
        socket.emit("leaveNotificationRoom", { userId: user_id });
      };
    }
  }, [socket, user_id, truncateText, filter]);

  // 🚀 Mark as read with optimistic updates
  const markAsRead = async (id = null) => {
    try {
      if (id) {
        // Optimistic update
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, seen: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        await api.post("/notifications/mark-seen", {
          notificationId: id,
          seen: true,
        });
      } else {
        setIsMarkingAllRead(true);
        // Optimistic update for all
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
        setUnreadCount(0);

        await api.post("/notifications/mark-all-seen", {});
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Mark as read error:", err);
      toast.error("Failed to update notifications");

      // Revert optimistic update on error
      if (id) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, seen: false } : n)
        );
        setUnreadCount(prev => prev + 1);
      }
    } finally {
      setIsMarkingAllRead(false);
      setActiveDropdown(null);
    }
  };

  // 🗑️ Clear seen notifications
  const clearSeenNotifications = async () => {
    if (!notifications.some(n => n.seen)) {
      toast.error("No read notifications to clear");
      return;
    }

    if (window.confirm("Clear all read notifications? This action cannot be undone.")) {
      try {
        setIsClearing(true);
        await api.delete("/notifications/clear-seen");
        setNotifications(prev => prev.filter(n => !n.seen));
        toast.success("Cleared read notifications");
      } catch (err) {
        console.error("Clear error:", err);
        toast.error("Failed to clear notifications");
      } finally {
        setIsClearing(false);
      }
    }
  };

  // 🚀 Process notifications for display with Client-Side Filtering Fallback
  const processedNotifications = useMemo(() => {
    let filtered = notifications;

    // If server filtering isn't perfect or we want to be sure
    if (filter !== 'all') {
      filtered = notifications.filter(n => {
        if (filter === 'like') return n.type === 'like' || n.type === 'comment_like';
        if (filter === 'comment') return n.type === 'comment';
        if (filter === 'reply') return n.type === 'reply';
        return true;
      });
    }

    return filtered.map((notif) => {
      const content = notif.extractedContent ||
        notif.comment?.comment ||
        notif.reply?.comment ||
        notif.comment_like?.comment ||
        "";

      return {
        ...notif,
        id: notif._id,
        username: notif.actorUsername || notif.user?.username || "someone",
        fullname: notif.actorFullname || notif.user?.fullname || "Someone",
        avatarUrl: notif.actorProfileImg || notif.user?.profile_img || "/default-avatar.png",
        content: content,
        truncatedContent: truncateText(content, 120),
        timeAgo: formatTimeAgo(notif.createdAt),
        link: generateLink(notif),
        blogTitle: notif.blogTitle || notif.blog?.title || "your post",
      };
    });
  }, [notifications, truncateText, formatTimeAgo, generateLink, filter]);

  // 🔍 SEO optimization
  useEffect(() => {
    document.title = unreadCount > 0
      ? `(${unreadCount}) Notifications | Shums`
      : `Notifications | Shums`;
  }, [unreadCount]);

  const handleRetry = () => {
    setPage(1);
    setError(null);
    fetchNotifications(1, true);
  };

  // 🎯 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'like', label: 'Likes' },
    { id: 'comment', label: 'Comments' },
    { id: 'reply', label: 'Replies' },
  ];

  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-dark-grey min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="text-gray-500 mt-4">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-white dark:bg-dark-grey">
      {/* 🚀 Modern Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-dark-grey/95 backdrop-blur-sm border-b border-gray-100 dark:border-grey p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => markAsRead()}
                disabled={isMarkingAllRead || unreadCount === 0}
                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-grey rounded-full transition-all"
                title="Mark all as read"
              >
                <FaCheckDouble className="text-lg" />
              </button>
              <button
                onClick={clearSeenNotifications}
                disabled={isClearing || !notifications.some(n => n.seen)}
                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-grey rounded-full transition-all"
                title="Clear read"
              >
                <FaTrash className="text-lg" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.id
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-grey dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 🚀 Notifications List */}
      {error ? (
        <ErrorDisplay message={error} onRetry={handleRetry} />
      ) : (
        <div className="pb-20">
          {processedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-grey rounded-full flex items-center justify-center mb-6">
                <IoMdNotificationsOutline className="text-gray-300 text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notifications yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {filter === 'all'
                  ? "When someone interacts with your content, you'll see it here."
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {processedNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group border-b border-gray-100 dark:border-grey transition-all duration-200 ${!notif.seen
                    ? 'bg-blue-50/30 dark:bg-blue-900/10'
                    : 'bg-white dark:bg-dark-grey hover:bg-gray-50 dark:hover:bg-black/20'
                    }`}
                >
                  <div className="p-5 flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 pt-1">
                      <Link to={`/user/${notif.username}`} className="block relative">
                        <img
                          src={notif.avatarUrl}
                          alt={notif.fullname}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-grey shadow-sm"
                          onError={(e) => { e.target.src = "/default-avatar.png"; }}
                        />
                        {/* Type Icon Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-dark-grey rounded-full p-0.5 shadow-sm">
                          {notif.type === 'like' && <div className="p-1 bg-red-100 text-red-500 rounded-full"><FaHeart size={10} /></div>}
                          {notif.type === 'comment' && <div className="p-1 bg-blue-100 text-blue-500 rounded-full"><FaCommentAlt size={10} /></div>}
                          {notif.type === 'reply' && <div className="p-1 bg-green-100 text-green-500 rounded-full"><FaReply size={10} /></div>}
                        </div>
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="text-gray-900 dark:text-white font-medium hover:underline cursor-pointer" onClick={() => navigate(`/user/${notif.username}`)}>
                              {notif.fullname}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                              {notif.type === 'like' && 'liked your post'}
                              {notif.type === 'comment' && 'commented on'}
                              {notif.type === 'reply' && 'replied to you on'}
                              {notif.type === 'comment_like' && 'liked your comment on'}
                            </span>
                            <Link to={notif.link} className="text-gray-900 dark:text-white font-medium hover:text-primary ml-1 transition-colors">
                              {notif.blogTitle}
                            </Link>
                          </div>

                          {/* Actual Comment Content */}
                          {notif.content && (notif.type === 'comment' || notif.type === 'reply') && (
                            <Link to={notif.link} className="block mt-2 p-3 bg-gray-50 dark:bg-grey/50 rounded-lg border border-gray-100 dark:border-grey/50 hover:border-gray-300 dark:hover:border-grey transition-colors group-hover:bg-white dark:group-hover:bg-grey">
                              <p className="text-gray-700 dark:text-gray-300 text-sm italic line-clamp-2">
                                &quot;{notif.content}&quot;
                              </p>
                            </Link>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                            <span>{notif.timeAgo}</span>
                            {!notif.seen && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>

                        {/* Menu */}
                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === notif.id ? null : notif.id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-grey rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <BsThreeDots />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === notif.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-grey shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                              >
                                <button
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-dark-grey transition-colors text-gray-700 dark:text-gray-200"
                                >
                                  <BsCheck2All />
                                  Mark as {notif.seen ? 'unread' : 'read'}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Loading and End States */}
          {loading && (
            <div className="p-4">
              <Loader />
            </div>
          )}

          {!loading && hasMore && (
            <div ref={bottomRef} className="h-4" />
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;