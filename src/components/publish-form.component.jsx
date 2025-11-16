import React, { useContext, useEffect, useState } from 'react';
import AnimationWrapper from '../common/page-animation';
import { Toaster, toast } from 'react-hot-toast';
import { EditorContext } from '../pages/editor.pages';
import axios from 'axios';
import Tags from './tags.component';
import DOMPurify from 'dompurify';
import { userContext } from '../App';
import { useNavigate } from 'react-router-dom';

const PublishForm = () => {
  const characterLimit = 180;
  const { blog, setEditorState } = useContext(EditorContext);
  const { banner, title, tags: initialTags, des, content, blog_id } = blog;
  const [description, setDescription] = useState(DOMPurify.sanitize(des || ''));
  const [tags, setTags] = useState([]);
  const { userAuth: { access_token } } = useContext(userContext);
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
    // Update blog context with new description
    setEditorState(prevState => ({
      ...prevState,
      blog: { ...prevState.blog, des: input }
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const publishBlog = async () => {
    if (isPublishing) return;
    if (description.length < 10) {
      return toast.error('Description should be at least 10 characters long');
    }
    if (tags.length < 1) {
      return toast.error('Please add at least one tag');
    }

    setIsPublishing(true);
    const loadingToast = toast.loading('Publishing your post...');

    // Build payload for publish request
    const blogObj = {
      title,
      des: description,
      banner,
      content,
      tags,
      draft: false,
    };

    // Include blog id if available (to update an existing post)
    if (blog_id) {
      blogObj.id = blog_id;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/create-post`,
        blogObj,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      toast.dismiss(loadingToast);
      toast.success('Post published successfully');
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Something went wrong, please try again');
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-start lg:grid-cols-2 py-16 lg:gap-8 bg-gray-100">
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%] bg-white rounded-full shadow-md flex items-center justify-center"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-rs-x text-gray-700"></i>
        </button>

        {/* Post Preview */}
        <div className="max-w-[550px] center lg:col-span-1 bg-white shadow-lg rounded-lg p-6">
          <span className="text-dark-grey mb-1">Post Preview</span>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-200 mt-4">
            {banner ? (
              <img src={banner} alt="Banner" className="object-cover w-full h-full" />
            ) : (
              <p className="text-center py-10">No Banner</p>
            )}
          </div>
          <hr className="w-full opacity-100 border-1 mt-3" />
          <span className="text-dark-grey mb-1">Post Title</span>
          <h1 className="text-2xl font-gelasio font-medium leading-tight line-clamp-2">
            {title || 'Untitled Post'}
          </h1>
          <hr className="w-full opacity-100 border-1 mt-2 mb-1" />
          <span className="text-dark-grey mb-2">Write Post Description</span>
          <textarea
            maxLength={characterLimit}
            value={description}
            className="h-20 input-box border border-dark-grey rounded-lg pl-4 mt-2 w-full shadow-sm resize-none"
            placeholder="Write your post short description here..."
            onChange={handleBlogDes}
            onKeyDown={handleKeyDown}
          />
          <p className="text-dark-grey text-sm text-right">
            {characterLimit - description.length} characters left
          </p>
        </div>

        {/* Post Details */}
        <div className="lg:col-span-1 pl-4 lg:mt-0 lg:pt-10 lg:pl-4 bg-white shadow-lg rounded-lg p-6">
          <span className="text-dark-grey mb-1">Post Description Preview</span>
          <p className="font-gelasio leading-7 h-20">{description}</p>
          <p className="text-dark-grey">Post Topics - (Helps your post in searching and ranking)</p>
          <div className="relative input-box pl-4">
            <Tags tags={tags} setTags={setTags} />
          </div>
          <button
            className={`btn-dark px-8 mt-4 ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={publishBlog}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
