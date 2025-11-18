/*
 * PATH: src/pages/ReaditCreatePostPage.jsx
 */
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userContext } from '../App';
import axiosInstance from '../common/api'; 
import { Helmet } from 'react-helmet-async';
import { UploadImage } from '../common/aws'; // Correct import path for AWS upload
import toast from 'react-hot-toast';
import Loader from '../components/loader.component';
import { motion } from 'framer-motion';

const ReaditCreatePostPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(userContext);
    
    // Form state
    const [formData, setFormData] = useState({
        communityName: '',
        title: '',
        content: '',
        postType: 'text', // 'text', 'link', 'image'
        url: '',
        image: ''
    });

    // Data & Loading state
    const [userCommunities, setUserCommunities] = useState([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- Fetch User Communities ---
    useEffect(() => {
        if (!userAuth?.access_token) return;

        const fetchUserCommunities = async () => {
            setCommunitiesLoading(true);
            try {
                // Assuming endpoint matches the route created earlier: /readit/user/communities
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

    // --- Handlers ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return toast.error('Image size should be less than 5MB');
        }

        setUploading(true);
        try {
            // Use UploadImage helper from aws.jsx
            const result = await UploadImage(file); 
            // Ensure we handle the result format correctly (URL string or object)
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.communityName) return toast.error('Please select a community');
        if (!formData.title.trim()) return toast.error('Title is required');

        if (formData.postType === 'link') {
            if (!formData.url) return toast.error('URL is required for link posts');
            // Simple URL validation
            try { new URL(formData.url); } catch (_) { return toast.error('Please enter a valid URL'); }
        }

        if (formData.postType === 'image' && !formData.image) {
            return toast.error('Please upload an image');
        }

        setIsLoading(true);

        // Construct Payload
        const postData = {
            title: formData.title,
            content: formData.content,
            postType: formData.postType,
            url: formData.url,
            image: formData.image
        };

        try {
            const { data } = await axiosInstance.post(`/readit/c/${formData.communityName}/posts`, postData);
            
            toast.success('Post created successfully!');
            navigate(`/readit/post/${data._id}`); // Redirect to the new post
        } catch (err) {
            console.error("Failed to create post:", err);
            toast.error(err.response?.data?.error || "Failed to create post.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Auth Guard ---
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
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Helmet>
                <title>Create Post | Readit</title>
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8"
            >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="bg-orange-500 text-white p-3 rounded-xl shadow-lg shadow-orange-500/20">
                        <i className="fi fi-rr-edit text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            Create a Post
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Share with the community
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* 1. Community Selection */}
                    <div>
                        <label htmlFor="communityName" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Choose Community <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <i className="fi fi-rr-users absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <select
                                id="communityName"
                                name="communityName"
                                value={formData.communityName}
                                onChange={handleInputChange}
                                className="input-box pl-10 appearance-none cursor-pointer"
                                required
                                disabled={communitiesLoading}
                            >
                                <option value="">{communitiesLoading ? "Loading..." : "Select a community"}</option>
                                {userCommunities.map(community => (
                                    <option key={community._id} value={community.name}>
                                        c/{community.name}
                                    </option>
                                ))}
                            </select>
                            <i className="fi fi-rr-angle-small-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                        {!communitiesLoading && userCommunities.length === 0 && (
                            <p className="text-xs text-orange-500 mt-2">
                                You need to join a community first. <span className="underline cursor-pointer" onClick={() => navigate('/readit/create-community')}>Create one?</span>
                            </p>
                        )}
                    </div>

                    {/* 2. Post Type Tabs */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Type
                        </label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                            {['text', 'image', 'link'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, postType: type }))}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                                        formData.postType === type
                                            ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <i className={`fi fi-rr-${type === 'text' ? 'document' : type === 'image' ? 'picture' : 'link-alt'}`}></i>
                                    <span className="capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="An interesting title..."
                            className="input-box text-lg font-semibold placeholder:font-normal"
                            maxLength={300}
                            required
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">{formData.title.length}/300</div>
                    </div>

                    {/* 4. Dynamic Content Area */}
                    <div className="min-h-[150px]">
                        {formData.postType === 'text' && (
                            <div className="animate-in fade-in duration-300">
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    placeholder="Text (optional). Markdown is supported."
                                    className="input-box min-h-[200px] resize-y font-mono text-sm leading-relaxed"
                                />
                            </div>
                        )}

                        {formData.postType === 'image' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    
                                    {uploading ? (
                                        <Loader />
                                    ) : formData.image ? (
                                        <div className="relative inline-block">
                                            <img 
                                                src={formData.image} 
                                                alt="Preview" 
                                                className="max-h-64 rounded-lg shadow-md" 
                                            />
                                            <div className="absolute -top-2 -right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                                                Click to change
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pointer-events-none">
                                            <i className="fi fi-rr-cloud-upload text-4xl text-gray-300 dark:text-gray-600 mb-2 block"></i>
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">Drag and drop or click to upload</span>
                                            <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {formData.postType === 'link' && (
                            <div className="animate-in fade-in duration-300">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                    Link URL <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="fi fi-rr-link absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input
                                        type="url"
                                        name="url"
                                        value={formData.url}
                                        onChange={handleInputChange}
                                        placeholder="https://..."
                                        className="input-box pl-10 text-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. Submit Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 btn-light py-3 rounded-xl font-bold text-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || uploading || (formData.postType === 'image' && !formData.image)}
                            className="flex-[2] btn-dark py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader /> : (
                                <>
                                    Post
                                    <i className="fi fi-rr-paper-plane"></i>
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