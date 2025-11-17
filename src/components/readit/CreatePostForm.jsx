import React, { useState, useContext } from 'react';
import { userContext } from '../../App'; // Use the context from App.jsx
import { apiCreateReaditPost } from '../../common/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../loader.component'; // Use your existing Loader

const CreatePostForm = ({ onPostCreated }) => {
  const { userAuth } = useContext(userContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return toast.error('A title is required to create a post.');
    }
    setIsSubmitting(true);

    try {
      const { data: newPost } = await apiCreateReaditPost({ title, content });
      onPostCreated(newPost); // Pass the new post up to the parent
      setTitle('');
      setContent('');
      setIsExpanded(false);
      toast.success('Post created!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-grey-2 border border-gray-200 dark:border-grey rounded-lg p-4 mb-6 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center space-x-3">
          <img
            src={userAuth?.profile_img}
            className="w-10 h-10 rounded-full"
            alt="Your avatar"
          />
          <input
            type="text"
            className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind? Create a new post..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            required
          />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                placeholder="Add more details... (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              ></textarea>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setTitle('');
                    setContent('');
                  }}
                  className="btn-light text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="btn-dark text-sm flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader/>
                  ) : (
                    <i className="fi fi-rr-paper-plane mr-2"></i>
                  )}
                  Post
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default CreatePostForm;