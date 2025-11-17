// src/pages/ReaditCreatePostPage.jsx - NEW FILE
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userContext } from '../App';
import { useCreateReaditPost, useUserCommunities } from '../hooks/useReaditApi';
import { Helmet } from 'react-helmet-async';
import { uploadImage } from '../common/api';
import toast from 'react-hot-toast';
import Loader from '../components/loader.component';
import { motion } from 'framer-motion';

const ReaditCreatePostPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(userContext);
    const { mutate: createPost, isLoading } = useCreateReaditPost();
    const { data: userCommunities, isLoading: communitiesLoading } = useUserCommunities();

    const [formData, setFormData] = useState({
        communityName: '',
        title: '',
        content: '',
        postType: 'text',
        url: '',
        image: ''
    });

    const [uploading, setUploading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const uploadedUrl = await uploadImage(file);
            setFormData(prev => ({ ...prev, image: uploadedUrl }));
            toast.success('Image uploaded!');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.communityName) {
            toast.error('Please select a community');
            return;
        }

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        if (formData.postType === 'link' && !formData.url) {
            toast.error('URL is required for link posts');
            return;
        }

        if (formData.postType === 'image' && !formData.image) {
            toast.error('Image is required for image posts');
            return;
        }

        createPost({
            communityName: formData.communityName,
            title: formData.title,
            content: formData.content,
            postType: formData.postType,
            url: formData.url,
            image: formData.image
        }, {
            onSuccess: (data) => {
                toast.success('Post created successfully!');
                navigate(`/readit/post/${data._id}`);
            }
        });
    };

    if (!userAuth?.access_token) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                    <i className="fi fi-rr-shield-exclamation text-4xl text-yellow-500 mb-4"></i>
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                        Authentication Required
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        You need to be logged in to create a post.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Helmet>
                <title>Create Post | Readit</title>
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg">
                        <i className="fi fi-rr-edit text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create a Post
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Share your thoughts with the community
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Community Selection */}
                    <div>
                        <label htmlFor="communityName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Choose Community *
                        </label>
                        <select
                            id="communityName"
                            name="communityName"
                            value={formData.communityName}
                            onChange={handleInputChange}
                            className="input-box"
                            required
                        >
                            <option value="">Select a community</option>
                            {userCommunities?.map(community => (
                                <option key={community._id} value={community.name}>
                                    c/{community.name} - {community.title}
                                </option>
                            ))}
                        </select>
                        {userCommunities?.length === 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                                You haven't joined any communities yet. <a href="/readit/create-community" className="underline">Create one</a> or join some communities first.
                            </p>
                        )}
                    </div>

                    {/* Post Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Post Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['text', 'image', 'link'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, postType: type }))}
                                    className={`p-3 rounded-lg border transition-all ${
                                        formData.postType === type
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        <i className={`fi fi-rr-${
                                            type === 'text' ? 'file-edit' : 
                                            type === 'image' ? 'image' : 'link'
                                        }`}></i>
                                        <span className="capitalize">{type}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter post title..."
                            className="input-box text-lg font-semibold"
                            required
                        />
                    </div>

                    {/* Content based on post type */}
                    {formData.postType === 'text' && (
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content (Markdown supported)
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="What's on your mind?..."
                                rows={6}
                                className="input-box resize-none"
                            />
                        </div>
                    )}

                    {formData.postType === 'image' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Image
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <i className="fi fi-rr-upload"></i>
                                    {formData.image ? 'Change Image' : 'Upload Image'}
                                </label>
                                {uploading && (
                                    <div className="mt-4">
                                        <Loader />
                                    </div>
                                )}
                                {formData.image && (
                                    <div className="mt-4">
                                        <img
                                            src={formData.image}
                                            alt="Post preview"
                                            className="max-w-full max-h-64 rounded-lg mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {formData.postType === 'link' && (
                        <div>
                            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                URL *
                            </label>
                            <input
                                type="url"
                                id="url"
                                name="url"
                                value={formData.url}
                                onChange={handleInputChange}
                                placeholder="https://example.com"
                                className="input-box"
                                required
                            />
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.communityName || !formData.title.trim()}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader />
                                    Creating...
                                </>
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