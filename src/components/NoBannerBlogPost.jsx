import React, { memo } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../common/date";

const MinimalPostCard = memo(({ blog, index }) => {
  let {
    title,
    blog_id: id,
    publishedAt,
    banner,
    authorId: {
      personal_info: { fullname, username, profile_img },
    },
    activity: { total_likes },
  } = blog;

  return (
    <Link
      to={`/post/${id}`}
      className="flex gap-4 items-center border-b border-dark-grey border-opacity-30 pb-4 mb-6"
    >
      {/* Index - Ensuring it's aligned properly */}
      <div className="w-10 text-lg font-semibold text-dark-grey shrink-0">
        {index < 10 ? `0${index + 1}` : index + 1}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3 text-sm text-dark-grey">
          <img src={profile_img} alt="Author" className="w-7 h-7 rounded-full" />
          <span className="font-medium">
            {fullname} <span className="opacity-70">@{username}</span>
          </span>
          <p className="min-w-fit opacity-60 text-xs">{formatDate(publishedAt)}</p>
        </div>

        {/* Title & Banner */}
        <div className="flex justify-between gap-4">
          <h1 className="line-clamp-2 text-base font-semibold">{title}</h1>
          <img className="w-20 h-20 rounded-lg object-cover" src={banner} alt="Banner" />
        </div>

        {/* Like Count */}
        <div className="flex items-center gap-2 mt-2 text-dark-grey text-sm">
          <i className="fi fi-rr-social-network text-lg"></i>
          {total_likes}
        </div>
      </div>
    </Link>
  );
});

MinimalPostCard.displayName = 'MinimalPostCard';

export default MinimalPostCard;
