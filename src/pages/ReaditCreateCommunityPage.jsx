// src/pages/ReaditCreateCommunityPage.jsx - NEW FILE
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userContext } from '../App';
import { useCreateReaditCommunity } from '../hooks/useReaditApi';
import { Helmet } from 'react-helmet-async';
import { uploadImage } from '../common/api';
import toast from 'react-hot-toast';
import Loader from '../components/loader.component';

const ReaditCreateCommunityPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(userContext);
    const { mutate: createCommunity, isLoading } = useCreateReaditCommunity();

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        icon: ''
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

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const uploadedUrl = await uploadImage(file);
            setFormData(prev => ({ ...prev, icon: uploadedUrl }));
            toast.success('Community icon uploaded!');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.title.trim()) {
            toast.error('Community name and title are required');
            return;
        }

        // Validate community name format
        const nameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!nameRegex.test(formData.name)) {
            toast.error('Community name must be 3-20 characters long and can only contain letters, numbers, and underscores');
            return;
        }

        createCommunity(formData, {
            onSuccess: (data) => {
                toast.success(`Community c/${formData.name} created successfully!`);
                navigate(`/readit/c/${formData.name}`);
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
                        You need to be logged in to create a community.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Helmet>
                <title>Create Community | Readit</title>
            </Helmet>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg">
                        <i className="fi fi-rr-users text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create a Community
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Build your own community and start sharing content
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Community Icon */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Community Icon
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                    {formData.icon ? (
                                        <img 
                                            src={formData.icon} 
                                            alt="Community icon" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <i className="fi fi-rr-camera text-gray-400 text-xl"></i>
                                    )}
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <Loader />
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    id="community-icon"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="community-icon"
                                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2"
                                >
                                    <i className="fi fi-rr-upload"></i>
                                    {formData.icon ? 'Change Icon' : 'Upload Icon'}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Recommended: 256x256px, max 5MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Community Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Community Name *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400">c/</span>
                            </div>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="community_name"
                                className="pl-10 input-box"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            3-20 characters, letters, numbers, and underscores only
                        </p>
                    </div>

                    {/* Community Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Community Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Awesome Community"
                            className="input-box"
                            required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            The display name for your community
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Describe what your community is about..."
                            rows={4}
                            className="input-box resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Let people know what your community is for
                        </p>
                    </div>

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
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fi fi-rr-plus"></i>
                                    Create Community
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReaditCreateCommunityPage;