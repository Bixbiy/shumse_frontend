import React, { useContext, useEffect, useState } from 'react';
import AnimationWrapper from '../common/page-animation';
import { Toaster, toast } from 'react-hot-toast';
import { EditorContext } from '../pages/editor.pages';
import api from '../common/api';
import Tags from './Tags';
import DOMPurify from 'dompurify';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';

const PublishForm = () => {
  const characterLimit = 180;
  const { blog, setEditorState } = useContext(EditorContext);
  const { banner, title, tags: initialTags, des, content, blog_id } = blog;
  const [description, setDescription] = useState(DOMPurify.sanitize(des || ''));
  const [tags, setTags] = useState([]);
  const { userAuth: { access_token } } = useContext(UserContext);
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);

  // Sync description with blog context
  useEffect(() => {
    setDescription(DOMPurify.sanitize(des || ''));
  }, [des]);

  // Capitalize tags and update local state
  useEffect(() => {
    const formattedTags = initialTags?.map(tag =>
      tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
    ) || [];
    setTags(formattedTags);
  }, [initialTags]);

  const handleCloseEvent = () => {
    setEditorState("editor");
  };

  const handleBlogDes = (e) => {
    const input = DOMPurify.sanitize(e.target.value);
    setDescription(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const publishBlog = async () => {
    if (isPublishing) return;

    // Validation
    if (description.length < 10) {
      return toast.error('Description should be at least 10 characters long');
    }
    if (tags.length < 1) {
      return toast.error('Please add at least one tag');
    }
    if (!banner || !banner.length) {
      return toast.error('Please upload a banner image');
    }
    if (!title || !title.length) {
      return toast.error('Title is required');
    }

    // Validate content structure
    if (!content || (typeof content === 'object' && !content.blocks)) {
      return toast.error('Please add some content to your blog');
    }

    setIsPublishing(true);
    const loadingToast = toast.loading('Publishing your post...');

    // Build payload for publish request
    // IMPORTANT: Backend expects content as an array containing the EditorJS object
    const blogObj = {
      title,
      des: description,
      banner,
      content: [content], // Wrap in array for backend compatibility
      tags,
      draft: false,
    };

    // Include blog id if available (to update an existing post)
    if (blog_id) {
      blogObj.id = blog_id;
    }

    // Log for debugging
    console.log('Publishing blog with:', {
      hasTitle: !!title,
      hasBanner: !!banner,
      hasContent: !!content,
      contentType: typeof content,
      contentBlocks: content?.blocks?.length,
      contentArrayFormat: Array.isArray(blogObj.content),
      tagsCount: tags.length,
      hasBlogId: !!blog_id
    });

    try {
      await api.post("/create-post", blogObj);
      toast.dismiss(loadingToast);
      toast.success('🎉 Post published successfully!');
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Publish error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || 'Something went wrong, please try again';
      toast.error(errorMsg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />

      {/* Close Button */}
      <button
        className="fixed w-12 h-12 right-4 md:right-8 top-4 md:top-8 z-50 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all"
        onClick={handleCloseEvent}
        aria-label="Close publish form"
      >
        <i className="fi fi-rs-cross text-xl text-gray-700"></i>
      </button>

      {/* Mobile-First Layout */}
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Left Column - Post Preview */}
            <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 order-2 lg:order-1">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                  Post Preview
                </h2>
                <p className="text-sm text-gray-500">See how your post will look</p>
              </div>

              {/* Banner Preview */}
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-200 shadow-md">
                {banner ? (
                  <img
                    src={banner}
                    alt="Banner"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <i className="fi fi-rr-picture text-4xl mb-2"></i>
                      <p className="text-sm">No Banner</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Title Preview */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Post Title
                </label>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight line-clamp-2">
                  {title || 'Untitled Post'}
                </h1>
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Description Input */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Post Description *
                </label>
                <textarea
                  maxLength={characterLimit}
                  value={description}
                  className="w-full h-24 md:h-28 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
                  placeholder="Write a compelling description for your post..."
                  onChange={handleBlogDes}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Minimum 10 characters required
                  </p>
                  <p className={`text-sm font-medium ${description.length < 10 ? 'text-orange-500' : 'text-gray-600'}`}>
                    {characterLimit - description.length} characters left
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Publishing Details */}
            <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 order-1 lg:order-2">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                  Publishing Details
                </h2>
                <p className="text-sm text-gray-500">Add tags and finalize your post</p>
              </div>

              {/* Description Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Description Preview
                </label>
                <p className="text-gray-700 leading-relaxed line-clamp-3">
                  {description || 'Your description will appear here...'}
                </p>
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Tags Input */}
              <div className="mb-8">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Post Tags *
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (Helps with discoverability)
                  </span>
                </label>
                <div className="relative">
                  <Tags tags={tags} setTags={setTags} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add up to 10 relevant tags. Press Enter or comma to add.
                </p>
              </div>

              {/* Publish Button */}
              <button
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform
                  ${isPublishing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-lg hover:shadow-xl'
                  } text-white`}
                onClick={publishBlog}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fi fi-rr-loading animate-spin"></i>
                    Publishing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fi fi-rr-paper-plane"></i>
                    Publish Post
                  </span>
                )}
              </button>

              {/* Validation Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <i className="fi fi-rr-info text-blue-600 text-xl mt-0.5"></i>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">
                      Before Publishing
                    </h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <i className={`fi ${banner ? 'fi-rs-check-circle text-green-600' : 'fi-rs-cross-circle text-gray-400'} text-sm`}></i>
                        Banner image uploaded
                      </li>
                      <li className="flex items-center gap-2">
                        <i className={`fi ${title?.length ? 'fi-rs-check-circle text-green-600' : 'fi-rs-cross-circle text-gray-400'} text-sm`}></i>
                        Title added
                      </li>
                      <li className="flex items-center gap-2">
                        <i className={`fi ${description.length >= 10 ? 'fi-rs-check-circle text-green-600' : 'fi-rs-cross-circle text-gray-400'} text-sm`}></i>
                        Description (min 10 chars)
                      </li>
                      <li className="flex items-center gap-2">
                        <i className={`fi ${tags.length >= 1 ? 'fi-rs-check-circle text-green-600' : 'fi-rs-cross-circle text-gray-400'} text-sm`}></i>
                        At least 1 tag added
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
