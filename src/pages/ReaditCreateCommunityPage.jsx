
/*
 * PATH: src/pages/ReaditCreateCommunityPage.jsx
 */
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import axiosInstance from '../common/api';
import { Helmet } from 'react-helmet-async';
import { UploadImage } from '../common/aws';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';

const ReaditCreateCommunityPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(UserContext);

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        icon: ''
    });

    const [uploading, setUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
            setFormData(prev => ({ ...prev, icon: url }));
            toast.success('Icon uploaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.title.trim()) {
            return toast.error('Community name and title are required');
        }

        // Strict Regex for Community Name (URL safe)
        const nameRegex = /^[a-z0-9_]{3,20}$/;
        if (!nameRegex.test(formData.name.toLowerCase())) {
            return toast.error('Name must be 3-20 chars (letters, numbers, underscores only). No spaces.');
        }

        setIsLoading(true);
        try {
            await axiosInstance.post('/readit/communities', {
                ...formData,
                name: formData.name.toLowerCase() // Ensure lowercase
            });

            toast.success(`c/${formData.name} created!`);
            navigate(`/readit/c/${formData.name}`);

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Creation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!userAuth?.access_token) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full p-6 mb-6">
                    <i className="fi fi-rr-lock text-4xl text-yellow-600 dark:text-yellow-400"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in Required</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You must be logged in to create a community.</p>
                <button onClick={() => navigate('/signin')} className="btn-dark px-8">Sign In</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Helmet>
                <title>Create Community | Readit</title>
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <i className="fi fi-rr-users-alt text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-tight">Create a Community</h1>
                            <p className="text-indigo-100 text-sm mt-1">Build a space for people with shared interests.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

                    {/* NAME INPUT */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-500 transition-colors">c/</span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="tech_enthusiasts"
                                className="input-box pl-8 font-medium"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <i className="fi fi-rr-info"></i>
                            Cannot be changed later. 3-20 characters. No spaces.
                        </p>
                    </div>

                    {/* TITLE INPUT */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Display Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Tech Enthusiasts Club"
                            className="input-box"
                            maxLength={50}
                        />
                    </div>

                    {/* DESCRIPTION INPUT */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="What is this community about?"
                            className="input-box h-32 resize-none leading-relaxed"
                            maxLength={500}
                        />
                    </div>

                    {/* ICON UPLOAD */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                            Community Icon
                        </label>
                        <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                                {uploading ? <Loader /> : (
                                    formData.icon ? <img src={formData.icon} className="w-full h-full object-cover" alt="Preview" />
                                        : <i className="fi fi-rr-camera text-3xl text-gray-300 dark:text-gray-600"></i>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className={`btn-light py-2 px-4 text-sm font-bold cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <i className="fi fi-rr-upload"></i>
                                    Upload Image
                                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploading} />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">Recommended: 256x256px. Max 5MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn-light px-6 py-2.5 rounded-xl font-bold text-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || uploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? <Loader /> : (
                                <>
                                    <i className="fi fi-rr-check"></i>
                                    Create Community
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </motion.div>
        </div>
    );
};

export default ReaditCreateCommunityPage;
