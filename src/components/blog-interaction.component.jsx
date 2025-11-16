// ── src/components/blog-interaction.component.jsx (API Refactored) ──

import React, { useContext, useState, useEffect, startTransition } from 'react';
import { postContext } from '../pages/blog.page';
import { userContext } from '../App';
import { Toaster, toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../common/api'; // --- REFACTORED: Use central API ---

const BlogInteraction = () => {
    // Get user authentication data from the user context
    const { userAuth: { access_token, username } } = useContext(userContext);
    // Get blog data and the updater function from the post context
    const { blog, setBlog, setCommentsWrapper } = useContext(postContext);

    // Local state for showing share options and handling button loading
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const currentUrl = window.location.href;

    /**
     * useEffect to check and update the like status on mount (or when blog._id changes)
     * This fetches the current like status from the server and updates the shared blog state.
     */
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (access_token && blog?._id) {
                try {
                    // --- REFACTORED: Use api.get ---
                    // No need for VITE_SERVER_DOMAIN or headers.
                    // '/api/v1' is automatically prefixed.
                    const { data } = await api.get(`/check-like/${blog._id}`);
                    
                    // Update the blog's activity object with the server's like status
                    startTransition(() => {
                        setBlog(prev => ({
                            ...prev,
                            activity: {
                                ...prev.activity,
                                isLikedByUser: data.is_liked,
                                // If the server returns a count, use it; otherwise fallback to the existing count
                                total_likes: data.total_likes ?? prev.activity?.total_likes ?? 0,
                            }
                        }));
                    });
                } catch (error) {
                    console.error("Error checking like status:", error);
                }
            }
        };

        checkLikeStatus();
    }, [access_token, blog?._id, setBlog]);

    /**
     * Handler to copy the current URL to the clipboard.
     */
    const handleCopyLink = () => {
        navigator.clipboard.writeText(currentUrl);
        toast.success('Link copied to clipboard!');
    };

    /**
     * Handler for like/unlike functionality.
     * Performs an optimistic UI update and then calls the API.
     */
    const handleLike = async () => {
        if (!access_token) {
            toast.error("Please login to like this post");
            return;
        }

        setIsLiking(true);
        // Save the original activity state for rollback in case of error
        const originalActivity = blog.activity;

        // Optimistically update the blog's activity in the shared state
        startTransition(() => {
            setBlog(prev => ({
                ...prev,
                activity: {
                    ...prev.activity,
                    isLikedByUser: !prev.activity?.isLikedByUser,
                    total_likes: !prev.activity?.isLikedByUser
                        ? (prev.activity?.total_likes || 0) + 1
                        : (prev.activity?.total_likes || 0) - 1,
                }
            }));
        });

        try {
            // --- REFACTORED: Use api.post ---
            // No need for VITE_SERVER_DOMAIN or headers.
            const { data } = await api.post(
                '/like-post',
                { _id: blog._id },
                
            );

            // Update the shared blog state with the fresh server response
            startTransition(() => {
                setBlog(prev => ({
                    ...prev,
                    activity: {
                        ...prev.activity,
                        isLikedByUser: data.liked_by_user,
                        total_likes: data.total_likes,
                    }
                }));
            });
        } catch (error) {
            // Rollback to the original state if the API call fails
            startTransition(() => {
                setBlog(prev => ({
                    ...prev,
                    activity: originalActivity,
                }));
            });
            toast.error(error.response?.data?.error || "Failed to update like status");
        } finally {
            setIsLiking(false);
        }
    };

    // If the blog data hasn't loaded yet, render nothing.
    if (!blog || !blog.title) return null;

    // Destructure needed blog properties
    const { title, blog_id, _id, activity, authorId } = blog;
    const { total_comments = 0 } = activity || {};
    const { username: author_username } = authorId?.personal_info || {};

    return (
        <>
            {/* Toast container for notifications */}
            <Toaster />

            {/* Divider */}
            <hr className="border-dark-grey/50 my-3" />

            {/* Interaction buttons section */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        aria-label={activity?.isLikedByUser ? 'Unlike post' : 'Like post'}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activity?.isLikedByUser
                            ? "bg-red/10 text-red hover:bg-red/20 scale-110"
                            : "bg-grey/20 text-dark-grey hover:bg-grey/30"
                            } ${isLiking ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {isLiking ? (
                            <i className="fi fi-rr-loading fi-spin text-xl"></i>
                        ) : (
                            <i className={`fi ${activity?.isLikedByUser ? "fi-sr-heart" : "fi-rr-heart"} text-xl transition-transform`} />
                        )}
                    </button>
                    {/* Display total likes */}
                    <p className="text-xl text-dark-grey">{activity?.total_likes || 0}</p>

                    {/* Comment Button */}
                    <button
                        onClick={() => { setCommentsWrapper(preVal => !preVal) }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/20 hover:bg-grey/30 text-dark-grey transition-colors"
                        aria-label="View comments"
                    >
                        <i className="fi fi-rr-comment-dots text-xl" />
                    </button>
                    {/* Display total comments */}
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                {/* Section for edit and share options */}
                <div className="flex gap-4 items-center">
                    {/* Show the Edit button only if the current user is the author */}
                    {username === author_username && (
                        <Link
                            to={`/editor/${blog_id}`}
                            className="bg-black text-white px-4 py-2 rounded-full hover:bg-grey/90 transition-colors flex items-center gap-2"
                            aria-label="Edit post"
                        >
                            <span>Edit</span>
                            <i className="fi fi-rr-pencil text-sm" />
                        </Link>
                    )}

                    {/* Share options dropdown */}
                    <div className="relative group">
                        <button
                            onClick={() => setShowShareOptions(!showShareOptions)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/20 hover:bg-grey/30 text-dark-grey transition-colors"
                            aria-label="Share options"
                        >
                            <i className="fi fi-sr-share text-lg" />
                        </button>

                        {showShareOptions && (
                            <div className="absolute right-0 bottom-full mb-2 w-44 bg-white dark:bg-gray-800 border border-grey/20 dark:border-gray-700 shadow-lg rounded-xl z-10 animate-fade-in">
                                <ul className="p-2 flex justify-around">
                                    {[
                                        {
                                            icon: 'facebook',
                                            color: '#1877F2',
                                            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
                                        },
                                        {
                                            icon: 'twitter',
                                            color: '#1DA1F2',
                                            url: `https://x.com/intent/tweet?text=${encodeURIComponent(`Read "${title}" - ${currentUrl}`)}`
                                        },
                                        {
                                            icon: 'whatsapp',
                                            color: '#25D366',
                                            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post: "${title}" - ${currentUrl}`)}`
                                        }
                                    ].map(({ icon, color, url }) => (
                                        <li key={icon}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center w-10 h-10 hover:bg-grey/10 dark:hover:bg-gray-700 transition-colors rounded-full"
                                                aria-label={`Share on ${icon}`}
                                            >
                                                <i
                                                    className={`fi fi-brands-${icon} text-xl`}
                                                    style={{ color }}
                                                />
                                            </a>
                                        </li>
                                    ))}

                                    {/* Copy link button */}
                                    <li>
                                        <button
                                            onClick={handleCopyLink}
                                            className="flex items-center justify-center w-10 h-10 hover:bg-grey/10 dark:hover:bg-gray-700 transition-colors rounded-full"
                                            aria-label="Copy link"
                                        >
                                            <i className="fi fi-rs-copy-alt text-xl text-dark-grey dark:text-gray-300" />
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <hr className="border-dark-grey/50 my-3" />
        </>
    );
};

export default BlogInteraction;