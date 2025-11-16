import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/loader.component';
import PostCard from '../components/blog-post.component';
import StoryCard from '../components/StoryCard';
import UserCard from '../components/usercard.component';
import { Helmet } from 'react-helmet';
import NoData from '../components/nodata.component';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'posts', label: 'Posts' },
  { key: 'stories', label: 'Stories' },
  { key: 'users', label: 'Users' }
];

// Modern glassmorphism tab style
const tabClasses = (active) =>
  `px-6 py-2 mx-1 rounded-xl font-semibold transition-all duration-300
   shadow-md backdrop-blur-md border border-blue-200
   ${active
    ? 'bg-gradient-to-tr from-blue-500/80 to-blue-400/80 text-white scale-105 shadow-lg'
    : 'bg-white/60 text-blue-700 hover:bg-blue-100/80 hover:text-blue-900'
  }`;

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-gradient-to-br from-blue-100/60 to-white/80 shadow-lg h-56 w-full mb-4" />
);

const SearchResultCard = React.memo(({ item, activeTab, searchQuery, searchedTag }) => {
  let content = null;
  const type = activeTab === 'all' ? item.type : activeTab;
  if (type === 'posts' || type === 'post') {
    content = <PostCard content={item} searchedTag={searchedTag} />;
  } else if (type === 'stories' || type === 'story') {
    content = <StoryCard story={item} />;
  } else if (type === 'users' || type === 'user') {
    content = <UserCard user={item} fallbackImage="/imgs/default-avatar.png" />;
  }
  return (
    <motion.div
      className="transition-transform"
      whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}
    >
      {content}
    </motion.div>
  );
});

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const SearchPage = () => {
  const { search_query } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if this is a tag search
  // If the pathname includes '/search/tag/', extract the tag
  let searchedTag = null;
  if (location.pathname.startsWith('/search/tag/')) {
    searchedTag = decodeURIComponent(search_query);
  } else if (location.state && location.state.searchedTag) {
    searchedTag = location.state.searchedTag;
  }

  const [pagination, setPagination] = useState({ results: [], page: 1, totalDocs: null, totalPages: null });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const debouncedQuery = useDebounce(search_query, 300);
  const isMounted = useRef(true);

  // Sync tab state from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromURL = params.get('tab');
    if (tabFromURL && tabs.some(t => t.key === tabFromURL)) {
      setActiveTab(tabFromURL);
    }
  }, [location.search]);

  // Scroll to top on tab or search change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, debouncedQuery]);

  // Fetch initial results (page 1)
  const fetchInitialResults = useCallback(async () => {
    if (!debouncedQuery) {
      setPagination({ results: [], page: 1, totalDocs: 0, totalPages: 1 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search/${activeTab}`,
        { params: { q: debouncedQuery, page: 1 } }
      );
      if (!isMounted.current) return;
      setPagination({
        results: data.results,
        page: 1,
        totalDocs: data.totalDocs ?? data.results.length,
        totalPages: data.totalPages ?? 1,
      });
    } catch (err) {
      if (!isMounted.current) return;
      setError('There was an error fetching results. Please try again.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [debouncedQuery, activeTab, retryKey]);

  // Load more results
  const loadMoreResults = async () => {
    const nextPage = pagination.page + 1;
    if (pagination.totalPages && nextPage > pagination.totalPages) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search/${activeTab}`,
        { params: { q: debouncedQuery, page: nextPage } }
      );
      if (!isMounted.current) return;
      setPagination(prev => ({
        ...prev,
        results: [...prev.results, ...data.results],
        page: nextPage,
        totalDocs: data.totalDocs ?? prev.totalDocs,
        totalPages: data.totalPages ?? prev.totalPages,
      }));
    } catch (err) {
      if (!isMounted.current) return;
      setError('There was an error loading more results.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // Re-fetch when the activeTab or search query changes
  useEffect(() => {
    isMounted.current = true;
    fetchInitialResults();
    return () => { isMounted.current = false; };
  }, [activeTab, debouncedQuery, fetchInitialResults]);

  // Accessibility: ARIA for tabs
  const tabListId = "search-tabs";

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-2 md:px-6 py-8 transition-all duration-300">
      <Helmet>
        <title>{`Search results for "${search_query}" | Spread`}</title>
        <meta name="description" content={`Search results for "${search_query}" on Spread.`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <motion.h1
          className="text-3xl md:text-4xl font-extrabold mb-8 text-center text-blue-700 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 bg-clip-text text-transparent">
            Results for: <span className="font-black">{search_query}</span>
          </span>
        </motion.h1>
        {/* Tabs */}
        <nav className="flex justify-center mb-10" aria-label="Search result categories">
          <motion.div
            role="tablist"
            aria-orientation="horizontal"
            id={tabListId}
            className="flex bg-white/70 rounded-2xl shadow-lg px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                className={tabClasses(activeTab === tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                id={`tab-${tab.key}`}
                tabIndex={activeTab === tab.key ? 0 : -1}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (activeTab !== tab.key) {
                    setActiveTab(tab.key);
                    navigate(`/search/${search_query}?tab=${tab.key}`);
                  }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </motion.div>
        </nav>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-center text-red-600 font-semibold mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {error}
              <button
                className="ml-4 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition"
                onClick={() => setRetryKey(k => k + 1)}
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {loading && pagination.results.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : pagination.results.length > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              <AnimatePresence>
                {pagination.results.map((item, i) => (
                  <motion.div
                    key={item.blog_id || item.story_id || item._id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 120 }}
                  >
                    <SearchResultCard
                      item={item}
                      activeTab={activeTab}
                      searchQuery={search_query}
                      searchedTag={searchedTag} // Pass only if tag search
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {/* "Load More" button */}
            {pagination.totalPages && pagination.page < pagination.totalPages && (
              <div className="flex justify-center mt-10">
                <motion.button
                  onClick={loadMoreResults}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all font-bold text-lg"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? <Loader /> : 'Load More'}
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-lg font-semibold text-blue-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <NoData isSearchPage={true} />
            <div className="mt-6 text-blue-500/80">No results found for <span className="font-bold">{search_query}</span></div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default SearchPage;
