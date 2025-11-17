import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async'; // For SEO
import { apiGetAllReaditPosts, apiCreateReaditPost } from '../common/api';
import { userContext } from '../App';
import { SocketProvider } from '../context/SocketContext';
import AnimationWrapper from '../common/page-animation';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import ReaditPostModal from '../components/readit/ReaditPostModal';
import AIAgentModal from '../components/readit/AiAgentModal';
import Loader from '../components/loader.component';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// --- Right-Hand Column Widgets ---
const CreatePostWidget = ({ user, onAiClick }) => (
    <div className="bg-white dark:bg-dark-grey rounded-lg border border-gray-200 dark:border-grey shadow-sm p-4">
        <div className="flex items-center gap-3">
            <Link to={`/user/${user.username}`}>
                <img src={user.profile_img} className="w-10 h-10 rounded-full" alt="Your avatar" />
            </Link>
            <input
                type="text"
                className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none cursor-pointer"
                placeholder="Create a new post..."
                readOnly
                onClick={() => document.getElementById('readit-title-input')?.focus()}
            />
        </div>
        <button
            onClick={onAiClick}
            className="btn-light text-sm w-full mt-3 flex items-center justify-center gap-2"
        >
            <i className="fi fi-rr-sparkles text-blue-500"></i>
            Generate Post Idea with AI
        </button>
    </div>
);

const AboutCommunityWidget = () => (
    <div className="bg-white dark:bg-dark-grey rounded-lg border border-gray-200 dark:border-grey shadow-sm p-4">
        <h3 className="font-semibold text-dark-grey dark:text-white mb-2">About Community</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a place for the Shumse community to share ideas, ask questions, and connect with each other. All topics welcome!
        </p>
        <Link to="/about" className="text-sm text-blue-500 hover:underline mt-3 inline-block">Learn more</Link>
    </div>
);

// --- Main Page Component ---
const ReaditPage = () => {
    const { userAuth } = useContext(userContext);
    const socket = useContext(SocketProvider);

    const [posts, setPosts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const createPostRef = useRef(null); // Ref for the create post form

    // Fetch initial posts
    const fetchPosts = () => {
        setIsLoading(true);
        apiGetAllReaditPosts()
            .then(({ data }) => {
                setPosts(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error('Failed to load community posts.');
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // --- Real-time Socket Listeners ---
    useEffect(() => {
        if (socket) {
            // New post created
            const newPostHandler = (newPost) => {
                setPosts((prevPosts) => [newPost, ...(prevPosts || [])]);
            };
            
            // Post voted on
            const postVoteHandler = ({ postId, votes, upvotedBy, downvotedBy }) => {
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId ? { ...post, votes, upvotedBy, downvotedBy } : post
                    )
                );
                // Update the modal post as well
                setSelectedPost(prev => prev?._id === postId ? { ...prev, votes, upvotedBy, downvotedBy } : prev);
            };
            
            // New comment created
            const newCommentHandler = (newComment) => {
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === newComment.post ? { ...post, commentCount: post.commentCount + 1 } : post
                    )
                );
                setSelectedPost(prev => prev?._id === newComment.post ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
            };
            
            socket.on('newReaditPost', newPostHandler);
            socket.on('readitPostVoted', postVoteHandler);
            socket.on('newReaditComment', newCommentHandler);
            
            return () => {
                socket.off('newReaditPost', newPostHandler);
                socket.off('readitPostVoted', postVoteHandler);
                socket.off('newReaditComment', newCommentHandler);
            };
        }
    }, [socket]);
    
    const handlePostCreated = useCallback((newPost) => {
        setPosts((prevPosts) => {
            if (prevPosts.find(p => p._id === newPost._id)) return prevPosts;
            return [newPost, ...prevPosts];
        });
        createPostRef.current?.resetForm();
    }, []);
    
    const handleAiPostGenerate = (title, content) => {
        createPostRef.current?.setFormValues(title, content);
        setIsAiModalOpen(false);
    };

    return (
        <AnimationWrapper>
            {/* SEO Component */}
            <Helmet>
                <title>Community Hub - Shumse</title>
                <meta name="description" content="Join the Shumse community hub to share ideas, ask questions, and connect with other members." />
            </Helmet>
            
            <div className="container mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* --- Main Content (Left Column) --- */}
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-dark-grey dark:text-white mb-6">
                            Community Hub
                        </h1>
                        
                        {userAuth.access_token && (
                            <CreatePostForm ref={createPostRef} onPostCreated={handlePostCreated} />
                        )}

                        {/* Post List */}
                        <div className="mt-8">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader />
                                </div>
                            ) : posts && posts.length > 0 ? (
                                <AnimatePresence>
                                    {posts.map((post, i) => (
                                        <motion.div
                                            key={post._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                        >
                                            <ReaditPostCard post={post} onClick={setSelectedPost} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
                                    No posts yet. Be the first to start a conversation!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* --- Sidebar (Right Column) --- */}
                    <aside className="hidden md:block">
                        <div className="sticky top-24 space-y-6">
                            {userAuth.access_token && (
                                <CreatePostWidget user={userAuth} onAiClick={() => setIsAiModalOpen(true)} />
                            )}
                            <AboutCommunityWidget />
                        </div>
                    </aside>

                </div>
            </div>

            {/* Post Modal */}
            <ReaditPostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
            
            {/* AI Post Generator Modal */}
            {isAiModalOpen && (
                <AIAgentModal
                    mode="post"
                    onClose={() => setIsAiModalOpen(false)}
                    onGenerate={handleAiPostGenerate}
                />
            )}
        </AnimationWrapper>
    );
};

// --- CreatePostForm (Refactored to use forwardRef) ---
const CreatePostForm = React.forwardRef(({ onPostCreated }, ref) => {
    const { userAuth } = useContext(userContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const titleInputRef = useRef(null);

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
        resetForm: () => {
            setTitle('');
            setContent('');
            setIsExpanded(false);
        },
        setFormValues: (newTitle, newContent) => {
            setTitle(newTitle);
            setContent(newContent);
            setIsExpanded(true);
            titleInputRef.current?.focus();
        }
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            return toast.error('A title is required to create a post.');
        }
        setIsSubmitting(true);

        try {
            const { data: newPost } = await apiCreateReaditPost({ title, content });
            onPostCreated(newPost); // Pass the new post up to the parent
            // No need to reset here, parent will call resetForm
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to create post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-dark-grey rounded-lg border border-gray-200 dark:border-grey shadow-sm p-4 mb-6">
            <form onSubmit={handleSubmit}>
                <div className="flex items-center space-x-3">
                    <img
                        src={userAuth?.profile_img}
                        className="w-10 h-10 rounded-full"
                        alt="Your avatar"
                    />
                    <input
                        id="readit-title-input" // ID for focusing
                        ref={titleInputRef}
                        type="text"
                        className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What's on your mind? Create a new post..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        required
                    />
                </div>
                
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <textarea
                                className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                                placeholder="Add more details... (optional)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                            ></textarea>
                            <div className="flex justify-end space-x-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setTitle('');
                                        setContent('');
                                    }}
                                    className="btn-light text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim()}
                                    className="btn-dark text-sm flex items-center disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader/>
                                    ) : (
                                        <i className="fi fi-rr-paper-plane mr-2"></i>
                                    )}
                                    Post
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
});

export default ReaditPage;