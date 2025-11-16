import {
    useState,
    useContext,
    useEffect,
    useCallback,
    useRef,
    useMemo
} from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import DOMPurify from "dompurify";
import { userContext } from "../App";
import { FaHeart, FaCommentAlt, FaReply, FaEllipsisV } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BsCheck2All, BsCheck2 } from "react-icons/bs";
import { RiSendPlaneFill } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { debounce } from "lodash";
import { toast } from "react-hot-toast";
import Loader from "../components/loader.component";
import { postContext } from "./blog.page";

const MAX_COMMENT_LENGTH = 100;

const Notifications = () => {
    // State management
    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const { blog, socket } = useContext(postContext);
    const { userAuth: { access_token, username, profile_img } = {} } = useContext(userContext);
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [bottomRef, inView] = useInView();

    const filters = ["all", "comment", "reply", "like", "comment_like"];

    // Memoized utility functions
    const truncateText = useCallback((text, maxLength = 100) => {
        if (!text) return "";
        return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
    }, []);

    const formatTimeAgo = useCallback((date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const generateLink = useCallback((notif) => {
        if (notif.blog) {
            const base = `/post/${notif.blog.blog_id}`;
            if (notif.type === 'comment_like' && notif.comment_like) {
                return `${base}#comment-${notif.comment_like._id}`;
            }
            return notif.comment ? `${base}#comment-${notif.comment._id}` :
                notif.reply ? `${base}#comment-${notif.reply._id}` : base;
        }
        return "#";
    }, []);

    // Sort notifications - unseen first, then seen by most recent
    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a, b) => {
            if (a.seen === b.seen) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return a.seen ? 1 : -1;
        });
    }, [notifications]);

    // Fetch notifications with debounce
    const fetchNotifications = useCallback(debounce(async (pageNum, filterType) => {
        if (!access_token || loading) return;

        setLoading(true);
        setError(null);

        try {
            const API = import.meta.env.VITE_SERVER_DOMAIN.replace(/\/+$/, "");
            const { data } = await axios.post(
                `${API}/notifications`,
                {
                    page: pageNum,
                    filter: filterType === "all" ? undefined : filterType
                },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            const newNotifications = data.notifications || [];

            setNotifications(prev =>
                pageNum === 1 ? newNotifications : [...prev, ...newNotifications]
            );

            setHasMore(newNotifications.length >= 10);
        } catch (err) {
            console.error("Notification fetch error:", err);
            setError("Failed to load notifications");
            toast.error("Couldn't load notifications");
        } finally {
            setLoading(false);
        }
    }, 300), [access_token]);

    // Initial load and filter changes
    useEffect(() => {
        if (access_token) {
            setPage(1);
            fetchNotifications(1, filter);
        }
    }, [access_token, filter, fetchNotifications]);

    // Infinite scroll trigger
    useEffect(() => {
        if (inView && !loading && hasMore) {
            setPage(prev => {
                const nextPage = prev + 1;
                fetchNotifications(nextPage, filter);
                return nextPage;
            });
        }
    }, [inView, loading, hasMore, filter, fetchNotifications]);

    // Handle reply submission
    const handleReplySubmit = async (notification) => {
        if (!replyContent.trim()) {
            toast.error("Please write something to reply");
            return;
        }

        if (!access_token) {
            toast.error("Please login to post a reply");
            return;
        }

        const sanitizedReply = DOMPurify.sanitize(replyContent.trim());
        setIsPostingReply(true);
        const toastId = toast.loading("Posting reply...");

        try {
            const API = import.meta.env.VITE_SERVER_DOMAIN.replace(/\/+$/, "");
            const { data } = await axios.post(
                `${API}/reply-comment`,
                {
                    blog_id: blog._id,
                    blog_author: blog.authorId._id,
                    comment: sanitizedComment,
                    ...(replyingTo && { parent_comment_id: replyingTo }),
                    username,
                    fullname,
                    profile_img
                },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            // Update notifications with the new reply
            setNotifications(prev => prev.map(n =>
                n._id === notification._id ? {
                    ...n,
                    reply: data,
                    seen: false,
                    type: "reply"
                } : n
            ));

            setReplyingTo(null);
            setReplyContent("");
            toast.success("Reply posted successfully!", { id: toastId });
        } catch (err) {
            console.error("Reply error:", err);
            toast.error("Failed to post reply", { id: toastId });
        } finally {
            setIsPostingReply(false);
        }
    };

    // Mark notifications as read
    const markAsRead = async (id = null) => {
        try {
            const API = import.meta.env.VITE_SERVER_DOMAIN.replace(/\/+$/, "");

            if (id) {
                await axios.post(
                    `${API}/notifications/mark-seen`,
                    { notificationId: id, seen: true },
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );

                setNotifications(prev => prev.map(n =>
                    n._id === id ? { ...n, seen: true } : n
                ));
            } else {
                setIsMarkingAllRead(true);
                await axios.post(
                    `${API}/notifications/mark-all-seen`,
                    {},
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );

                setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
                toast.success("All notifications marked as read");
            }
        } catch (err) {
            console.error("Mark as read error:", err);
            toast.error("Failed to update notifications");
        } finally {
            setIsMarkingAllRead(false);
            setActiveDropdown(null);
        }
    };

    // Clear seen notifications
    const clearSeenNotifications = async () => {
        try {
            setIsClearing(true);
            const API = import.meta.env.VITE_SERVER_DOMAIN.replace(/\/+$/, "");

            await axios.post(
                `${API}/notifications/clear-seen`,
                {},
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            setNotifications(prev => prev.filter(n => !n.seen));
            toast.success("Cleared read notifications");
        } catch (err) {
            console.error("Clear error:", err);
            toast.error("Failed to clear notifications");
        } finally {
            setIsClearing(false);
        }
    };

    // Notification type rendering
    const renderNotificationType = useCallback((type) => {
        switch (type) {
            case "comment":
                return {
                    icon: <FaCommentAlt className="text-blue-500" />,
                    color: "bg-blue-100",
                    text: "commented on your post"
                };
            case "like":
                return {
                    icon: <FaHeart className="text-red-500" />,
                    color: "bg-red-100",
                    text: "liked your post"
                };
            case "reply":
                return {
                    icon: <FaReply className="text-green-500" />,
                    color: "bg-green-100",
                    text: "replied to your comment"
                };
            case "comment_like":
                return {
                    icon: <FaHeart className="text-pink-500" />,
                    color: "bg-pink-100",
                    text: "liked your comment"
                };
            default:
                return {
                    icon: <IoMdNotificationsOutline className="text-purple-500" />,
                    color: "bg-purple-100",
                    text: "sent you a notification"
                };
        }
    }, []);

    // Process notifications for display
    const processedNotifications = useMemo(() => {
        return sortedNotifications.map(notif => {
            const actor = notif.user?.personal_info || {};
            let content = "";
            let secondaryActor = null;

            // Determine content based on notification type
            switch (notif.type) {
                case 'comment':
                    content = notif.comment?.content || "";
                    break;
                case 'reply':
                    content = notif.reply?.content || "";
                    secondaryActor = notif.replied_on_comment?.commented_by?.personal_info;
                    break;
                case 'comment_like':
                    content = notif.comment_like?.content || "";
                    break;
                case 'like':
                    content = notif.blog?.title || "";
                    break;
            }

            return {
                ...notif,
                id: notif._id,
                username: actor.username || "Someone",
                fullname: actor.fullname || "Someone",
                avatarUrl: actor.profile_img || "/default-avatar.png",
                content: content,
                truncatedContent: truncateText(content, 120),
                timeAgo: formatTimeAgo(notif.createdAt),
                link: generateLink(notif),
                secondaryActor,
                isCommentLike: notif.type === 'comment_like',
                isReply: notif.type === 'reply',
                isComment: notif.type === 'comment',
                isLike: notif.type === 'like'
            };
        });
    }, [sortedNotifications, truncateText, formatTimeAgo, generateLink]);

    // SEO optimization
    useEffect(() => {
        document.title = "Notifications | Shumse";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'View and manage your notifications');
        }
    }, []);

    return (
        <div className="max-w-xl mx-auto bg-white min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Notifications</h1>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => markAsRead()}
                            disabled={isMarkingAllRead}
                            className="text-sm text-blue-500 font-medium disabled:opacity-50"
                        >
                            {isMarkingAllRead ? "Marking..." : "Mark all read"}
                        </button>
                        <button
                            onClick={clearSeenNotifications}
                            disabled={isClearing}
                            className="text-sm text-gray-500 disabled:opacity-50"
                        >
                            {isClearing ? "Clearing..." : "Clear read"}
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex space-x-2 mt-4 overflow-x-auto scrollbar-hide">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f
                                ? 'bg-black text-white shadow-md'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </header>

            {/* Notifications list */}
            <div
                ref={containerRef}
                className="divide-y divide-gray-100 pb-20"
            >
                {processedNotifications.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <IoMdNotificationsOutline className="text-gray-300 text-5xl mb-4" />
                        <p className="text-gray-500">No notifications yet</p>
                        <p className="text-gray-400 text-sm mt-2">
                            When you get notifications, they'll show up here
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {processedNotifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`p-4 ${!notif.seen ? 'bg-blue-50' : 'bg-white'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar with notification type */}
                                    <div className="relative">
                                        <img
                                            src={notif.avatarUrl}
                                            alt={`${notif.fullname}'s profile`}
                                            className="h-12 w-12 rounded-full object-cover border-2 border-white"
                                            loading="lazy"
                                            width="48"
                                            height="48"
                                        />
                                        <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${renderNotificationType(notif.type).color}`}>
                                            {renderNotificationType(notif.type).icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link
                                                    to={`/${notif.username}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {notif.username}
                                                </Link>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    {renderNotificationType(notif.type).text}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-400">
                                                    {notif.timeAgo}
                                                </span>
                                                {notif.seen ? (
                                                    <BsCheck2All className="text-blue-500" />
                                                ) : (
                                                    <BsCheck2 className="text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Comment/reply content - TikTok style */}
                                        {notif.content && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-gray-800 text-sm">
                                                    {notif.content}
                                                </p>
                                                {notif.secondaryActor && notif.isReply && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        In reply to <Link to={`/${notif.secondaryActor.username}`} className="font-medium hover:underline">
                                                            {notif.secondaryActor.username}
                                                        </Link>'s comment
                                                    </p>
                                                )}
                                                {notif.isCommentLike && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        On post: <Link to={notif.link.split('#')[0]} className="font-medium hover:underline">
                                                            {notif.blog?.title || "your post"}
                                                        </Link>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply section */}
                                        {replyingTo === notif.id ? (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 overflow-hidden"
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={profile_img || '/default-avatar.png'}
                                                            alt={`${username}'s avatar`}
                                                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="relative">
                                                            <textarea
                                                                value={replyContent}
                                                                onChange={(e) => setReplyContent(e.target.value)}
                                                                placeholder="Write your reply..."
                                                                disabled={isPostingReply}
                                                                autoFocus
                                                                className="w-full p-2 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-sm placeholder-gray-400 text-gray-800 resize-none"
                                                                rows="2"
                                                                maxLength={MAX_COMMENT_LENGTH}
                                                            />
                                                            <div className="absolute right-1 bottom-1">
                                                                <button
                                                                    onClick={() => handleReplySubmit(notif)}
                                                                    disabled={isPostingReply || !replyContent.trim()}
                                                                    className={`p-1 rounded-full transition-colors ${isPostingReply
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : !replyContent.trim()
                                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                        }`}
                                                                >
                                                                    <RiSendPlaneFill className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end mt-1">
                                                            <button
                                                                onClick={() => setReplyingTo(null)}
                                                                className="text-xs text-gray-500 hover:text-gray-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            (notif.isComment || notif.isReply) && (
                                                <div className="flex items-center space-x-4 mt-3">
                                                    <button
                                                        onClick={() => setReplyingTo(notif.id)}
                                                        className="text-sm text-blue-500 hover:underline"
                                                    >
                                                        Reply
                                                    </button>
                                                    <Link
                                                        to={notif.link}
                                                        className="text-sm text-gray-500 hover:underline"
                                                    >
                                                        View post
                                                    </Link>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Dropdown menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === notif.id ? null : notif.id)}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            <FaEllipsisV className="w-4 h-4" />
                                        </button>

                                        {activeDropdown === notif.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20"
                                            >
                                                <button
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                >
                                                    Mark as {notif.seen ? "unread" : "read"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigate(notif.link);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                >
                                                    View post
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Loading and end indicators */}
                {loading && (
                    <Loader />
                )}

                {!loading && !hasMore && notifications.length > 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        You're all caught up
                    </div>
                )}

                <div ref={bottomRef} className="h-1" />
            </div>
        </div>
    );
};

export default Notifications;