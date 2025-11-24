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
import { FaHeart, FaCommentAlt, FaReply, FaEllipsisV, FaTrash, FaCheckDouble } from "react-icons/fa";
import { IoMdNotifications, IoMdNotificationsOutline } from "react-icons/io";
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
        console.log(`📨 Fetching notifications - Page: ${pageNum}`);

        const { data } = await api.post("/notifications", {
          page: pageNum,
          limit: 15
        });

        console.log("📨 Notifications API Response:", data);

        const newNotifications = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        console.log(`📥 Processed ${newNotifications.length} notifications`);

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
        const unread = newNotifications.filter(n => !n.seen).length;
        if (pageNum === 1) {
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
  }, []);

  // 🚀 Fixed initial load - only load page 1
  useEffect(() => {
    if (userAuth.access_token) {
      console.log("🔄 Initial loading of notifications");
      setPage(1);
      setNotifications([]);
      setHasMore(true);
      setInitialLoading(true);
      fetchNotifications(1);
    }
  }, [userAuth.access_token, fetchNotifications]);

  // 🚀 Fixed infinite scroll - only load next page when conditions are met
  useEffect(() => {
    if (inView && !loading && hasMore && pageRef.current === 1) {
      const nextPage = pageRef.current + 1;
      console.log("📜 Loading more notifications, page:", nextPage);
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [inView, loading, hasMore, fetchNotifications]);

  // 🚀 Enhanced real-time socket integration
  useEffect(() => {
    if (socket && user_id) {
      console.log("🔌 Setting up socket for notifications");

      const handleNewNotification = (newNotif) => {
        console.log("🎊 New real-time notification:", newNotif);

        const username = newNotif.user?.username || newNotif.actorUsername || "Someone";

        // Smart notifications based on type
        const notificationTypes = {
          like: `❤️ ${username} liked your post`,
          comment: `💬 ${username} commented: "${truncateText(newNotif.extractedContent, 50)}"`,
          reply: `↩️ ${username} replied: "${truncateText(newNotif.extractedContent, 50)}"`,
          comment_like: `👍 ${username} liked your comment`
        };

        toast.success(notificationTypes[newNotif.type] || `🔔 New notification from ${username}`);

        // Add to top of list
        setNotifications(prev => {
          if (prev.find(n => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });

        // Update unread count
        setUnreadCount(prev => prev + 1);
      };

      socket.on("new_notification", handleNewNotification);

      // Join notification room
      socket.emit("joinNotificationRoom", { userId: user_id });

      return () => {
        socket.off("new_notification", handleNewNotification);
        socket.emit("leaveNotificationRoom", { userId: user_id });
      };
    }
  }, [socket, user_id, truncateText]);

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

        toast.success("Marked as read");
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

  // 🎨 Notification type rendering
  const renderNotificationIcon = useCallback((type) => {
    const configs = {
      comment: {
        icon: <FaCommentAlt className="text-blue-500" />,
        color: "bg-blue-500/10 text-blue-600",
        bg: "bg-blue-500",
      },
      like: {
        icon: <FaHeart className="text-red-500" />,
        color: "bg-red-500/10 text-red-600",
        bg: "bg-red-500",
      },
      reply: {
        icon: <FaReply className="text-green-500" />,
        color: "bg-green-500/10 text-green-600",
        bg: "bg-green-500",
      },
      comment_like: {
        icon: <FaHeart className="text-pink-500" />,
        color: "bg-pink-500/10 text-pink-600",
        bg: "bg-pink-500",
      },
    };

    return configs[type] || {
      icon: <IoMdNotificationsOutline className="text-purple-500" />,
      color: "bg-purple-500/10 text-purple-600",
      bg: "bg-purple-500",
    };
  }, []);

  // 🚀 Process notifications for display
  const processedNotifications = useMemo(() => {
    return notifications.map((notif) => {
      const content = notif.extractedContent ||
        notif.comment?.comment ||
        notif.reply?.comment ||
        notif.comment_like?.comment ||
        "Left a comment";

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
  }, [notifications, truncateText, formatTimeAgo, generateLink]);

  // 🔍 SEO optimization
  useEffect(() => {
    document.title = unreadCount > 0
      ? `(${unreadCount}) Notifications | Shumse`
      : `Notifications | Shumse`;
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

  if (initialLoading) {
    return (
      <div className="max-w-xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="text-gray-500 mt-4">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen">
      {/* 🚀 Modern Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IoMdNotifications className="text-2xl text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {notifications.length > 0
                  ? `${notifications.length} notifications`
                  : "No notifications yet"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAsRead()}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FaCheckDouble className="text-sm" />
              {isMarkingAllRead ? "Marking..." : "Mark all read"}
            </button>

            <button
              onClick={clearSeenNotifications}
              disabled={isClearing || !notifications.some(n => n.seen)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FaTrash className="text-sm" />
              {isClearing ? "Clearing..." : "Clear read"}
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 Notifications List */}
      {error ? (
        <ErrorDisplay message={error} onRetry={handleRetry} />
      ) : (
        <div className="pb-20">
          {processedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <IoMdNotificationsOutline className="text-gray-300 text-6xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No notifications yet</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                When someone likes, comments, or interacts with your content, you'll see it here.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {processedNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`border-b border-gray-100 transition-all duration-200 ${!notif.seen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={notif.avatarUrl}
                          alt={notif.fullname}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.src = "/default-avatar.png";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                to={`/${notif.username}`}
                                className="font-semibold text-gray-900 hover:underline text-sm"
                              >
                                {notif.username}
                              </Link>
                              <span className="text-gray-500 text-sm">•</span>
                              <span className="text-gray-500 text-xs">{notif.timeAgo}</span>
                            </div>

                            {/* Notification Content */}
                            <div className="mb-2">
                              <p className="text-gray-800 text-sm leading-relaxed">
                                {notif.truncatedContent}
                              </p>
                              {notif.blogTitle && (
                                <p className="text-gray-500 text-xs mt-1">
                                  on <span className="font-medium">{notif.blogTitle}</span>
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <Link
                                to={notif.link}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                              >
                                {notif.seen ? 'Mark unread' : 'Mark read'}
                              </button>
                            </div>
                          </div>

                          {/* Status and Menu */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notif.seen && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === notif.id ? null : notif.id);
                                }}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                              >
                                <BsThreeDots className="w-4 h-4" />
                              </button>

                              <AnimatePresence>
                                {activeDropdown === notif.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40 py-1"
                                  >
                                    <button
                                      onClick={() => {
                                        markAsRead(notif.id);
                                        setActiveDropdown(null);
                                      }}
                                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    >
                                      <BsCheck2All className="text-sm" />
                                      Mark as {notif.seen ? 'unread' : 'read'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(notif.link);
                                        setActiveDropdown(null);
                                      }}
                                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    >
                                      <FaCommentAlt className="text-sm" />
                                      View post
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
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

          {!loading && !hasMore && notifications.length > 0 && (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-sm">
                🎉 You're all caught up!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;