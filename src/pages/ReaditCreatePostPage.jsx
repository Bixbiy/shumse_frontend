// UPDATED ReaditCreatePostPage.jsx with AI Integration
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import axiosInstance from '../common/api';
import { Helmet } from 'react-helmet-async';
import { UploadImage } from '../common/aws';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import AIAgentModal from '../components/readit/AIAgentModal';

const ReaditCreatePostPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(UserContext);

    const [formData, setFormData] = useState({
        communityName: '',
        title: '',
        content: '',
        postType: 'text',
        url: '',
        image: ''
    });

    const [userCommunities, setUserCommunities] = useState([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    // Fetch user communities
    useEffect(() => {
        if (!userAuth?.access_token) return;

        const fetchUserCommunities = async () => {
            setCommunitiesLoading(true);
            try {
                const { data } = await axiosInstance.get('/readit/user/communities');
                setUserCommunities(data || []);
            } catch (err) {
                console.error("Failed to fetch user communities:", err);
                toast.error("Could not load your communities.");
            } finally {
                setCommunitiesLoading(false);
            }
        };

        fetchUserCommunities();
    }, [userAuth?.access_token]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            return toast.error('Image size should be less than 5MB');
        }

        setUploading(true);
        try {
            const result = await UploadImage(file);
            const url = typeof result === 'string' ? result : result.url;
            setFormData(prev => ({ ...prev, image: url }));
            toast.success('Image uploaded successfully!');
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleAIGenerate = (title, content) => {
        setFormData(prev => ({
            ...prev,
            title: title || prev.title,
            content: content || prev.content
        }));
        toast.success('AI content generated!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) return toast.error('Title is required');
        if (formData.title.length > 300) return toast.error('Title too long');

        // Disable button during submission
        setIsLoading(true);

        const endpoint = formData.communityName
            ? `/readit/c/${formData.communityName}/posts`
            : '/readit/posts/personal';

        const postData = {
            title: formData.title,
            content: formData.content,
            postType: formData.postType,
            url: formData.url,
            image: formData.image
        };

        try {
            const { data } = await axiosInstance.post(endpoint, postData);
            toast.success('Post created successfully!');
            navigate(`/readit/post/${data._id}`);
        } catch (err) {
            console.error("Failed to create post:", err);
            toast.error(err.response?.data?.error || "Failed to create post.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auth Guard
    if (!userAuth?.access_token) {
        return (
            <div className="max-w-2xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full p-6 mb-6">
                    <i className="fi fi-rr-lock text-4xl text-yellow-600 dark:text-yellow-400"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Please sign in to share your thoughts.</p>
                <button onClick={() => navigate('/signin')} className="btn-dark px-8">Sign In</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Helmet>
                <title>Create Post | Readit</title>
                <meta name="description" content="Create a new post - share text, images, or links with the community" />
            </Helmet>

            {/* AI Agent Modal */}
            <AnimatePresence>
                {showAIModal && (
                    <AIAgentModal
                        mode="post"
                        onClose={() => setShowAIModal(false)}
                        onGenerate={handleAIGenerate}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <i className="fi fi-rr-edit text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-tight">
                                Create a Post
                            </h1>
                            <p className="text-orange-100 text-sm">
                                Share with the community or post personally
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

                    {/* Community Selection */}
                    <div>
                        <label htmlFor="communityName" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Post to Community (Optional)
                        </label>
                        <div className="relative">
                            <i className="fi fi-rr-users absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <select
                                id="communityName"
                                name="communityName"
                                value={formData.communityName}
                                onChange={(e) => setFormData(prev => ({ ...prev, communityName: e.target.value }))}
                                className="input-box pl-10 appearance-none cursor-pointer"
                                disabled={communitiesLoading}
                            >
                                <option value="">Post personally (u/{userAuth.personal_info?.username})</option>
                                {userCommunities.map(community => (
                                    <option key={community._id} value={community.name}>
                                        c/{community.name}
                                    </option>
                                ))}
                            </select>
                            <i className="fi fi-rr-angle-small-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>

                    {/* Title with AI Button */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowAIModal(true)}
                                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                                <i className="fi fi-rr-sparkles text-xs"></i>
                                AI Assist
                            </button>
                        </div>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="An interesting title that grabs attention..."
                            className="input-box text-lg font-semibold placeholder:font-normal focus:ring-2 focus:ring-orange-500"
                            maxLength={300}
                            required
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Post type: <span className="font-bold capitalize">{formData.postType}</span></span>
                            <span>{formData.title.length}/300</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                Content
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Share your thoughts, paste a URL, or upload an image..."
                                className="input-box min-h-[200px] resize-y text-sm leading-relaxed transition-all duration-200"
                            />
                        </div>

                        {/* Image Upload Preview */}
                        <AnimatePresence>
                            {formData.image && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative"
                                >
                                    <div className="border-2 border-dashed border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                                <i className="fi fi-rr-picture mr-2"></i>
                                                Image Uploaded
                                            </span>
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <img
                                            src={formData.image}
                                            alt="Post preview"
                                            className="max-h-64 rounded-lg mx-auto shadow-md"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                        {/* Image Upload Button */}
                        <label className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold cursor-pointer flex-1 transition-all ${uploading
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'btn-light hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}>
                            {uploading ? (
                                <Loader />
                            ) : (
                                <>
                                    <i className="fi fi-rr-camera"></i>
                                    Upload Image
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </label>

                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 btn-light py-3 rounded-xl font-bold text-gray-500"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || uploading || !formData.title.trim()}
                            className="flex-[2] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/25"
                        >
                            {isLoading ? (
                                <Loader />
                            ) : (
                                <>
                                    <i className="fi fi-rr-paper-plane"></i>
                                    Create Post
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ReaditCreatePostPage;