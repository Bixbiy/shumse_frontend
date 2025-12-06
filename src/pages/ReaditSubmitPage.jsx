/*
 * Path: src/pages/ReaditSubmitPage.jsx
 */
import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { Helmet } from 'react-helmet-async';
import InPageNavigation from '../components/InPageNavigation';
import { UploadImage } from '../common/aws';
import toast from 'react-hot-toast';
import axiosInstance from '../common/api';
import Loader from '../components/Loader';

const API_DOMAIN = import.meta.env.VITE_SERVER_DOMAIN + "/api/v1/readit";

const ReaditSubmitPage = () => {
    const { communityName } = useParams();
    const navigate = useNavigate();
    const { userAuth } = useContext(UserContext);

    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Set the post type state when the tab changes
    const handleTabChange = (btn, i) => {
        setPostType(btn.innerText.toLowerCase());
    }

    const handleImageUpload = async (e) => {
        const img = e.target.files[0];
        if (!img) return;

        let loadingToast = toast.loading("Uploading image...");
        try {
            const uploadedUrl = await UploadImage(img); //
            setImage(uploadedUrl);
            toast.success("Image uploaded!");
        } catch (err) {
            toast.error("Image upload failed.");
        } finally {
            toast.dismiss(loadingToast);
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

        const postData = {
            title,
            postType,
            content: postType === 'text' ? content : undefined,
            url: postType === 'link' ? url : undefined,
            image: postType === 'image' ? image : undefined,
        };

        setIsLoading(true);
        try {
            const { data } = await axiosInstance.post(`/readit/c/${communityName}/posts`, postData);
            toast.success("Post created!");
            navigate(`/readit/post/${data._id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to create post.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Helmet>
                <title>Submit to c/{communityName}</title>
            </Helmet>
            <h1 className="text-2xl font-bold mb-2">Create a Post</h1>
            <p className="text-dark-grey mb-4">Posting to <span className="font-semibold">c/{communityName}</span></p>

            <div className="bg-white dark:bg-grey-dark rounded-lg shadow-md border border-grey dark:border-grey-dark">
                <InPageNavigation
                    routes={['Text', 'Image', 'Link']}
                    defaultIndex={0}
                    onChange={handleTabChange}
                >
                    {/* The InPageNavigation component handles showing the active tab line */}
                </InPageNavigation>

                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-box mb-4 text-2xl font-semibold"
                    />

                    {postType === 'text' && (
                        <textarea
                            placeholder="What's on your mind? (Markdown supported)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input-box h-40"
                        />
                    )}

                    {postType === 'image' && (
                        <div className="border border-dashed border-grey p-4 rounded-md text-center">
                            <input type="file" id="upload-image-input" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <label htmlFor="upload-image-input" className="cursor-pointer text-blue hover:underline">
                                {image ? "Change Image" : "Upload Image"}
                            </label>
                            {image && <img src={image} alt="Post preview" className="w-full rounded-md mt-4" />}
                        </div>
                    )}

                    {postType === 'link' && (
                        <input
                            type="url"
                            placeholder="https://your-link.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="input-box"
                        />
                    )}

                    <div className="flex justify-end mt-4">
                        <button onClick={handleSubmit} disabled={isLoading} className="btn-dark px-8 flex items-center gap-2">
                            {isLoading ? (
                                <>
                                    <Loader />
                                    <span>Posting...</span>
                                </>
                            ) : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaditSubmitPage;