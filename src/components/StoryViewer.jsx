// src/components/StoryViewerModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-toastify/dist/ReactToastify.css';
import Loader from './loader.component';

const modalRoot = (() => {
  const existing = document.getElementById('modal-root');
  if (existing) return existing;
  const div = document.createElement('div');
  div.id = 'modal-root';
  document.body.appendChild(div);
  return div;
})();

export default function StoryViewerModal() {
  const { story_id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showNavArrows, setShowNavArrows] = useState(false);

  const modalRef = useRef(null);

  // Handle errors
  const handleError = (error) => {
    console.error('Error:', error);
    toast.error('Failed to load story content');
    navigate(-1);
  };

  // Fetch story with error handling
  useEffect(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/story/${story_id}`)
      .then(({ data }) => {
        setStory(data);
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [story_id]);

  // Progress bar animation (faster at 3 seconds per slide)
  useEffect(() => {
    if (!story?.images?.length || paused) return;

    let startTime = null;
    let animationFrameId = null;
    const duration = 3000; // 3 seconds per slide

    const animateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);
      setProgress(progressPercent);

      if (progressPercent < 100) {
        animationFrameId = requestAnimationFrame(animateProgress);
      } else {
        goToNext();
      }
    };

    animationFrameId = requestAnimationFrame(animateProgress);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [current, story, paused]);

  // Auto-advance when progress completes
  const goToNext = () => {
    setCurrent(prev => {
      const next = prev + 1;
      if (next >= story.images.length) {
        navigate(-1); // Close when last slide is done
        return prev;
      }
      return next;
    });
    setProgress(0);
  };

  const goToPrev = () => {
    setCurrent(prev => Math.max(prev - 1, 0));
    setProgress(0);
  };

  // Improved swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (story && current < story.images.length - 1) {
        goToNext();
      }
    },
    onSwipedRight: () => {
      if (current > 0) {
        goToPrev();
      }
    },
    onSwipedUp: () => navigate(-1), // Swipe up to close
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
    delta: 30 // More sensitive swipe
  });

  const handlePause = () => {
    setPaused(true);
    setShowNavArrows(true);
  };

  const handleResume = () => {
    setPaused(false);
    setShowNavArrows(false);
  };

  // Close modal when clicking outside content
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      navigate(-1);
    }
  };

  // Render loader
  if (loading) {
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 z-50">
        <div className="flex flex-col items-center">
          <Loader />
          <p className="mt-4 text-white font-medium text-lg">Loading story...</p>
        </div>
      </div>,
      modalRoot
    );
  }

  if (!story) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* Story Modal */}
      <div
        ref={modalRef}
        className="relative w-full h-full max-w-2xl max-h-[90vh] flex flex-col z-60 overflow-hidden rounded-xl shadow-2xl border border-gray-700"
        {...handlers}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
      >
        <ToastContainer
          position="top-center"
          autoClose={2000}
          toastClassName="bg-gray-800 text-white"
          progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
        />

        {/* Header with progress bars */}
        <header className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex space-x-1 mb-3">
            {story.images.map((_, idx) => (
              <div
                key={idx}
                className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full ${current === idx ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : current > idx ? 'bg-gray-400' : 'bg-gray-600'}`}
                  style={{
                    width: current === idx ? `${progress}%` : current > idx ? '100%' : '0%',
                    transition: current === idx ? 'width 0.05s linear' : 'none'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 bg-opacity-70 flex items-center justify-center backdrop-blur-sm border border-gray-600">
                <span className="text-white text-sm font-bold">
                  {current + 1}/{story.images.length}
                </span>
              </div>
              <h4 className="ml-3 text-white font-bold line-clamp-2 bg-gradient-to-br from-blue-900 to-indigo-900 p-2 drop-shadow-lg">
                {story.title}
              </h4>
            </div>

            <button
              onClick={() => navigate(-1)}
              aria-label="Close story"
              className="text-white p-2 hover:bg-gray-800 hover:bg-opacity-50 rounded-full backdrop-blur-sm transition-all transform hover:rotate-90 duration-300"
            >
              <FiX size={28} />
            </button>
          </div>
        </header>

        {/* Image slide with click navigation */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {/* Navigation arrows (visible on hover/pause) */}
          {showNavArrows && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 z-30 p-3 bg-gray-900 bg-opacity-60 rounded-full hover:bg-opacity-80 transition-all backdrop-blur-sm border border-gray-600 transform hover:-translate-x-1"
                aria-label="Previous slide"
              >
                <FiChevronLeft size={32} className="text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 z-30 p-3 bg-gray-900 bg-opacity-60 rounded-full hover:bg-opacity-80 transition-all backdrop-blur-sm border border-gray-600 transform hover:translate-x-1"
                aria-label="Next slide"
              >
                <FiChevronRight size={32} className="text-white" />
              </button>
            </>
          )}

          {/* Clickable navigation areas */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
            onClick={goToPrev}
          />

          <div className="relative w-full h-full flex items-center justify-center">
            <LazyLoadImage
              src={story.images[current].url}
              alt={story.images[current].description || story.title}
              effect="blur"
              className="max-h-full max-w-full object-contain transition-opacity duration-300"
              wrapperClassName="w-full h-full flex items-center justify-center"
              placeholderSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" fill="%23cccccc"%3E%3Crect width="16" height="9"/%3E%3Ctext x="8" y="5" font-family="Arial" font-size="4" text-anchor="middle" fill="white"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
            onClick={goToNext}
          />
        </div>

        {/* Footer with description */}
        <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 z-10">
          <div className="text-white max-w-full">
            <p
              className="text-base md:text-lg line-clamp-3 font-medium drop-shadow-lg px-4 py-2 bg-black bg-opacity-40 rounded-lg backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: story.images[current].description }}
            />
          </div>
        </footer>
      </div>
    </div>,
    modalRoot
  );
}