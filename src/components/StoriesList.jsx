// src/pages/StoriesList.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../common/api';
import Navbar from '../components/Navbar';
import StoryCard from '../components/StoryCard';
import AdCard from '../components/AdSection';
import NoData from '../components/NoData';
import { Helmet } from 'react-helmet';

// Skeleton shimmer card
const SkeletonCard = () => (
  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
);

// Interleave ads every interval
const intersperseAds = (items, interval = 4) => {
  const list = [];
  items.forEach((item, idx) => {
    list.push(item);
    if ((idx + 1) % interval === 0) {
      list.push(
        <div key={`ad-${idx}`} className="col-span-full lg:col-span-4">
          <AdCard />
        </div>
      );
    }
  });
  return list;
};

export default function StoriesList() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isTrending = pathname.includes('trending');
  const endpoint = isTrending
    ? '/trending-stories-pagination'
    : '/stories-pagination-latest';
  const title = isTrending ? 'Trending Stories' : 'Latest Stories';

  const [stories, setStories] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const observer = useRef();

  // Fetch stories by cursor
  const fetchStories = async (cur = null) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        endpoint,
        { limit: 8, cursor: cur }
      );
      setStories(prev => (cur ? [...prev, ...data.stories] : data.stories));
      setHasMore(data.hasMore);
      if (data.stories.length) {
        const last = data.stories[data.stories.length - 1];
        setCursor(isTrending ? last.trendingScore : last.publishedAt);
      }



    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when path changes
  useEffect(() => {
    // Reset when switching tabs
    setStories([]);
    setCursor(null);
    setHasMore(true);
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Infinite scroll
  const lastRef = useCallback(
    node => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore) fetchStories(cursor);
        },
        { rootMargin: '200px' }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, cursor]
  );

  // Tabbed Navigation
  const TabButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <Helmet>
        <title>{title} | Shumse</title>
        <meta name="description" content={`Stay updated with the ${title.toLowerCase()}. Fast, SEO-optimized.`} />
      </Helmet>

      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 flex justify-center space-x-4">
          <TabButton label="Latest" active={!isTrending} onClick={() => navigate('/stories')} />
          <TabButton label="Trending" active={isTrending} onClick={() => navigate('/stories/trending')} />
        </div>

        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">{title}</h1>

        {!loading && stories.length === 0 && <NoData pageType="story" />}

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && stories.length === 0
            ? Array(8).fill().map((_, i) => <SkeletonCard key={i} />)
            : intersperseAds(
              stories.map((story, i) => {
                const card = <StoryCard key={story.story_id} story={story} />;
                return i === stories.length - 1 ? (
                  <div ref={lastRef} key={story.story_id}>
                    {card}
                  </div>
                ) : (
                  card
                );
              }),
              4
            )}
        </div>

        {!loading && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetchStories(cursor)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </>
  );
}
