import React, { memo } from 'react';
import { formatDate } from '../common/date';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

const PostCard = memo(({ content, searchedTag }) => {
  if (!content) return null;

  // Improved: Robust author extraction for "all" tab and "posts" tab
  // Try content.author, content.authorId, or content.user, fallback to {}
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
    user // sometimes user is used for author info
  } = content;

  // Try all possible author sources
  const authorObj = author || authorId || user || {};
  const { personal_info = {} } = authorObj;
  const {
    fullname = authorObj.fullname || 'Anonymous',
    username = authorObj.username || 'unknown',
    profile_img = authorObj.profile_img || 'https://via.placeholder.com/100'
  } = personal_info;

  return (
    <article
      className="group relative flex gap-6 items-center bg-white/70 dark:bg-dark-grey/40 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-grey rounded-2xl p-6 mb-8 hover:-translate-y-1 duration-200"
    >
      {/* Left Section - Content */}
      <div className="flex-1 min-w-0">
        {/* Author Info */}
        <header className="flex items-center gap-3 mb-4">
          <OptimizedImage
            src={profile_img}
            alt={fullname}
            className="w-11 h-11 rounded-full border-2 border-white dark:border-grey shadow-sm object-cover"
          />
          <div className="text-sm font-semibold flex flex-col sm:flex-row sm:gap-2 sm:items-center">
            <span className="capitalize text-gray-900 dark:text-white">{fullname}</span>
            {username && <span className="text-gray-500 dark:text-gray-400 font-normal">@{username}</span>}
          </div>
          {publishedAt && (
            <time dateTime={publishedAt} className="ml-auto text-xs text-gray-400 font-medium">
              {formatDate(publishedAt)}
            </time>
          )}
        </header>

        {/* Title */}
        <h3 className="text-xl font-bold line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-150 mb-2">
          <Link to={`/post/${post_id}`} className="before:absolute before:inset-0 focus:outline-none">
            {title}
          </Link>
        </h3>

        {/* Searched Tag Badge */}
        {searchedTag && (
          <div className="mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-primary-600 to-primary-400 text-white rounded-full text-xs font-semibold shadow-sm">
              #{searchedTag}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed line-clamp-2 mb-4">
          {des}
        </p>

        {/* Footer: Tags & Likes */}
        <footer className="flex items-center gap-4">
          {Array.isArray(tags) && tags.length > 0 && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-grey text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">
              #{tags[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm font-medium" aria-label={`${activity?.total_likes ?? 0} likes`}>
            <i className="fi fi-rr-heart"></i>
            {activity?.total_likes ?? 0}
          </span>
        </footer>
      </div>

      {/* Right Section - Banner Image */}
      <div className="hidden sm:block w-32 h-32 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gray-100 dark:bg-grey">
        {banner ? (
          <OptimizedImage
            src={banner}
            alt={`Banner for ${title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <i className="fi fi-rr-image text-3xl"></i>
          </div>
        )}
      </div>
    </article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
