import React, { memo } from 'react';
import { formatDate } from '../common/date';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

const PostCard = memo(({ content, searchedTag }) => {
  if (!content) return null;

  const {
    blog_id: post_id,
    title,
    banner,
    des,
    tags = [],
    publishedAt,
    activity,
    author,
    authorId,
    user
  } = content;

  const authorObj = author || authorId || user || {};
  const { personal_info = {} } = authorObj;
  const {
    fullname = authorObj.fullname || 'Anonymous',
    username = authorObj.username || 'unknown',
    profile_img = authorObj.profile_img || 'https://via.placeholder.com/100'
  } = personal_info;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex gap-6 items-center bg-white dark:bg-neutral-800 shadow-sm hover:shadow-xl transition-all border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 mb-6"
    >
      {/* Left Section - Content */}
      <div className="flex-1 min-w-0">
        {/* Author Info */}
        <header className="flex items-center gap-3 mb-4">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
            <OptimizedImage
              src={profile_img}
              alt={fullname}
              className="w-11 h-11 rounded-full border-2 border-neutral-200 dark:border-neutral-700 shadow-sm object-cover"
            />
          </motion.div>
          <div className="text-sm font-semibold flex flex-col sm:flex-row sm:gap-2 sm:items-center">
            <span className="capitalize text-neutral-900 dark:text-white">{fullname}</span>
            {username && <span className="text-neutral-500 dark:text-neutral-400 font-normal">@{username}</span>}
          </div>
          {publishedAt && (
            <time dateTime={publishedAt} className="ml-auto text-xs text-neutral-400 font-medium">
              {formatDate(publishedAt)}
            </time>
          )}
        </header>

        {/* Title */}
        <h3 className="text-xl font-bold line-clamp-2 text-neutral-900 dark:text-white group-hover:text-primary transition-colors duration-150 mb-2">
          <Link to={`/post/${post_id}`} className="before:absolute before:inset-0 focus:outline-none">
            {title}
          </Link>
        </h3>

        {/* Searched Tag Badge */}
        {searchedTag && (
          <div className="mb-2">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 bg-gradient-to-r from-primary to-primary-600 text-white rounded-full text-xs font-semibold shadow-sm"
            >
              #{searchedTag}
            </motion.span>
          </div>
        )}

        {/* Description */}
        <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed line-clamp-2 mb-4">
          {des}
        </p>

        {/* Footer: Tags & Likes */}
        <footer className="flex items-center gap-4">
          {Array.isArray(tags) && tags.length > 0 && (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded-full font-medium"
            >
              #{tags[0]}
            </motion.span>
          )}
          <motion.span
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-sm font-medium"
            aria-label={`${activity?.total_likes ?? 0} likes`}
          >
            <i className="fi fi-rr-heart"></i>
            {activity?.total_likes ?? 0}
          </motion.span>
        </footer>
      </div>

      {/* Right Section - Banner Image */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="hidden sm:block w-32 h-32 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-neutral-100 dark:bg-neutral-700"
      >
        {banner ? (
          <OptimizedImage
            src={banner}
            alt={`Banner for ${title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-600">
            <i className="fi fi-rr-image text-3xl"></i>
          </div>
        )}
      </motion.div>
    </motion.article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
