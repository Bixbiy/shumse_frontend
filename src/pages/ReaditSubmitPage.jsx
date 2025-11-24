/*
 * FIXED FILE: src/pages/ReaditSubmitPage.jsx
 */
import React, { useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { Helmet } from 'react-helmet-async';
import InPageNavigation from '../components/InPageNavigation';
import toast from 'react-hot-toast';
import { UploadImage } from '../common/aws';
import Loader from '../components/Loader';
// Import the axios helper instead of defining a mutation hook
import { createReaditPost } from '../hooks/useReaditApi';

const ReaditSubmitPage = () => {
    const { communityName } = useParams();
    const navigate = useNavigate();
    const { userAuth } = useContext(UserContext);

    // Refs for nav component
    const navRef = useRef();

    // State
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');

    // Local loading state (Replaces TanStack 'isLoading')
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleTabChange = (btn, i) => {
        setPostType(btn.innerText.toLowerCase());
    };

    const handleImageUpload = async (e) => {
        const img = e.target.files[0];
        if (!img) return;

        setIsUploading(true);
        const loadingToast = toast.loading("Uploading image...");

        try {
            const uploadedUrl = await UploadImage(img);
            // Ensure we handle if UploadImage returns object or string
            const imageUrl = typeof uploadedUrl === 'object' ? uploadedUrl.url : uploadedUrl;
            setImage(imageUrl);
            toast.success("Image uploaded!");
        } catch (err) {
            console.error(err);
            toast.error("Image upload failed.");
        } finally {
            toast.dismiss(loadingToast);
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            return toast.error("A title is required.");
        }
        if (postType === 'link' && !url) {
            return toast.error("A URL is required.");
        }
        if (postType === 'image' && !image) {
            return toast.error("An image is required.");
        }

        setIsLoading(true);

        // Construct data object expected by createReaditPost
        const postData = {
            communityName, // Important: Pass community name here
            title,
            postType,
            content: postType === 'text' ? content : undefined,
            url: postType === 'link' ? url : undefined,
            image: postType === 'image' ? image : undefined,
        };

        try {
            const response = await createReaditPost(postData);
            toast.success("Post created!");
            // Redirect to the new post
            navigate(`/readit/post/${response.data._id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to create post.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auth Guard
    if (!userAuth?.access_token) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center">
                <h2 className="text-xl font-bold text-dark-grey">You must be logged in to post.</h2>
                <button onClick={() => navigate('/signin')} className="btn-dark mt-4">Sign In</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Helmet>
                <title>Submit to c/{communityName} | Readit</title>
            </Helmet>

            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Create a Post</h1>
                <p className="text-dark-grey">
                    Posting to <span className="font-semibold text-black dark:text-white">c/{communityName}</span>
                </p>
            </div>

            <div className="bg-white dark:bg-grey-dark rounded-lg shadow-md border border-grey dark:border-grey-dark overflow-hidden">
                <InPageNavigation
                    ref={navRef}
                    routes={['Text', 'Image', 'Link']}
                    defaultActiveIndex={0}
                    defaultHidden={[]}
                    onRouteChange={handleTabChange}
                />

                <div className="p-6">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-box mb-4 text-xl font-semibold placeholder:font-normal"
                        maxLength={300}
                    />

                    {postType === 'text' && (
                        <textarea
                            placeholder="What's on your mind? (Markdown supported)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input-box h-64 resize-y font-mono text-sm leading-relaxed"
                        />
                    )}

                    {postType === 'image' && (
                        <div className="border-2 border-dashed border-grey dark:border-grey/30 bg-grey/5 p-8 rounded-lg text-center">
                            <input
                                type="file"
                                id="upload-image-input"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="upload-image-input"
                                className="cursor-pointer inline-flex flex-col items-center gap-2"
                            >
                                <i className="fi fi-rr-picture text-4xl text-dark-grey"></i>
                                <span className="text-blue font-medium hover:underline">
                                    {image ? "Change Image" : "Upload Image"}
                                </span>
                            </label>

                            {image && (
                                <div className="mt-4 relative inline-block">
                                    <img src={image} alt="Post preview" className="max-h-64 rounded-md shadow-sm" />
                                </div>
                            )}
                        </div>
                    )}

                    {postType === 'link' && (
                        <div className="relative">
                            <i className="fi fi-rr-link-alt absolute left-4 top-1/2 -translate-y-1/2 text-dark-grey"></i>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="input-box pl-10 text-blue"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-grey dark:border-grey/20">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-light px-6"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || isUploading}
                            className="btn-dark px-8 flex items-center gap-2"
                        >
                            {isLoading ? <Loader /> : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaditSubmitPage;