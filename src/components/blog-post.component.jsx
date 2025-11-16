import React from 'react';
import { formatDate } from '../common/date';
import { Link } from 'react-router-dom';

const PostCard = ({ content, searchedTag }) => {
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
    <Link
      to={`/post/${post_id}`}
      className="group flex gap-6 items-center bg-white/70 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all border border-blue-100 hover:border-blue-300 rounded-2xl p-6 mb-8 hover:-translate-y-1 hover:scale-[1.015] duration-200"
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(80, 120, 255, 0.06)'
      }}
    >
      {/* Left Section - Content */}
      <div className="flex-1 min-w-0">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={profile_img}
            alt={fullname}
            className="w-11 h-11 rounded-full border-2 border-blue-100 shadow-sm object-cover"
            loading="lazy"
          />
          <span className="text-sm font-semibold flex gap-2 items-center">
            <span className="capitalize text-blue-800">{fullname}</span>
            {username && <span className="text-gray-400 font-normal">@{username}</span>}
          </span>
          {publishedAt && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {formatDate(publishedAt)}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-xl font-extrabold line-clamp-2 text-blue-900 group-hover:text-blue-700 transition-colors duration-150">
          {title}
        </h4>

        {/* Searched Tag Badge */}
        {searchedTag && (
          <div className="mt-2">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-600 to-blue-600 text-white rounded-full text-xs font-semibold shadow">
              #{searchedTag}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="mt-2 text-gray-600 text-base leading-6 line-clamp-2">
          {des}
        </p>

        {/* Tags & Likes */}
        <div className="flex items-center mt-5 gap-4">
          {Array.isArray(tags) && tags.length > 0 && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium shadow-sm">
              #{tags[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-pink-800 text-sm font-semibold">
            <svg width="18" height="18" fill="currentColor" className="inline-block"><path d="M9 16s-5.053-3.053-7.071-5.071A5 5 0 009 2a5 5 0 017.071 8.929C14.053 12.947 9 16 9 16z" /></svg>
            {activity?.total_likes ?? 0}
          </span>
        </div>
      </div>

      {/* Right Section - Banner Image */}
      <div className="w-32 h-32 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-gradient-to-br from-blue-100 to-white group-hover:scale-105 transition-transform duration-200">
        {banner ? (
          <img
            src={banner}
            alt="Post Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-blue-200 text-lg font-bold">
            No Banner
          </div>
        )}
      </div>
    </Link>
  );
};

export default PostCard;
