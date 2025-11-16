// src/components/StoryCard.jsx
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../common/date';

const StoryCard = ({ story }) => {
  const navigate = useNavigate();

  return (
    <article
      role="link"
      aria-label={story.title}
      onClick={() => navigate(`/story/${story.story_id}`)}
      className="group cursor-pointer transform transition duration-300 hover:scale-105"
    >
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl">
        <img
          src={story.banner}
          alt={story.title}
          loading="lazy"
          className="w-full h-48 object-cover rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-30 group-hover:opacity-50 transition" />
        <header className="absolute bottom-4 left-4 text-white max-w-[85%]">
          <h4 className=" font-semibold bg-black/50 p-1   line-clamp-2">{story.title}</h4>
        </header>
      </div>

      <footer className="mt-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-b-2xl flex items-center justify-between text-gray-700 dark:text-gray-300">
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-1">


          </div>
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M2 5a2 2 0 012-2h3.28a2 2 0 011.789 1.106l1.447 2.894a2 2 0 001.789 1.106H16a2 2 0 012 2v6a2 2 0 01-2 2h-3.28a2 2 0-1.789-1.106l-1.447-2.894a2 2 0-1.789-1.106H4a2 2 0-2-2V5z" />
            </svg>
            <span>{story.activity?.total_reads || 0}</span>
          </div>
        </div>
        <time dateTime={story.publishedAt} className="text-xs">
          {formatDate(story.publishedAt)}
        </time>
      </footer>
    </article>
  );
};

export default memo(StoryCard);
