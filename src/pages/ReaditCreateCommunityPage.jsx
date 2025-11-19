/*
 * PATH: src/pages/ReaditCreateCommunityPage.jsx
 */
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userContext } from '../App';
import axiosInstance from '../common/api'; 
import { Helmet } from 'react-helmet-async';
import { UploadImage } from '../common/aws';
import toast from 'react-hot-toast';
import Loader from '../components/loader.component';

const ReaditCreateCommunityPage = () => {
    const navigate = useNavigate();
    const { userAuth } = useContext(userContext);
    
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
            setFormData(prev => ({ ...prev, icon: result })); // Assuming UploadImage returns the URL string
             
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
            <div className="h-[50vh] flex flex-col items-center justify-center text-center px-4">
                <i className="fi fi-rr-lock text-4xl text-gray-400 mb-4"></i>
                <h2 className="text-2xl font-bold mb-2">Sign in Required</h2>
                <p className="text-gray-500 mb-6">You must be logged in to create a community.</p>
                <button onClick={() => navigate('/signin')} className="btn-dark px-6">Sign In</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Helmet>
                <title>Create Community | Readit</title>
            </Helmet>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <div className="border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a Community</h1>
                    <p className="text-gray-500 mt-1">Build a space for people with shared interests.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* NAME INPUT */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">c/</span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="tech_enthusiasts"
                                className="input-box pl-8"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
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
                            className="input-box h-24 resize-none"
                            maxLength={500}
                        />
                    </div>

                    {/* ICON UPLOAD */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Community Icon
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                {uploading ? <Loader /> : (
                                    formData.icon ? <img src={formData.icon} className="w-full h-full object-cover" alt="Preview"/> 
                                    : <i className="fi fi-rr-camera text-2xl text-gray-400"></i>
                                )}
                            </div>
                            <label className="btn-light py-2 px-4 text-sm cursor-pointer">
                                Upload Image
                                <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)} 
                            className="btn-light px-6 py-2"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading || uploading} 
                            className="btn-dark px-8 py-2"
                        >
                            {isLoading ? "Creating..." : "Create Community"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ReaditCreateCommunityPage;