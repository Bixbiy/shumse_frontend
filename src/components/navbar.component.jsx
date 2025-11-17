import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from "react";
import site_logo from "../imgs/logo.png";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { userContext } from "../App"; // <-- FIX: Lowercase 'u'
import UserNaivgationPanel from "./user-navigation.component";
import { useDebouncedCallback } from "use-debounce";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";

import { Helmet } from "react-helmet-async";
import ThemeToggleButton from '../utils/ThemeToggleBtn';
import { toast } from "react-hot-toast";
import api from "../common/api";

// Preload critical assets with cache busting
const preloadAssets = () => {
  if (typeof window === 'undefined') return;

  const assets = [
    { href: site_logo, as: 'image', type: 'image/png' },
    // Add other critical assets here
  ];

  assets.forEach(asset => {
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      const versionQuery = import.meta.env.VITE_APP_VERSION ? `?v=${import.meta.env.VITE_APP_VERSION}` : '';
      link.href = `${asset.href}${versionQuery}`;
      link.as = asset.as;
      if (asset.type) link.type = asset.type;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch (error) {
      console.error('Error preloading assets:', error);
    }
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Dummy cache function
async function getCachedSuggestions(query) {
  return [];
}

const Navbar = () => {

  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const { userAuth, setUserAuth } = useContext(userContext); // <-- FIX: Lowercase 'u'
  const { access_token, profile_img, full_name, username, role, new_notification_available } = userAuth || {};
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('');
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const location = useLocation();

  // Preload assets on component mount
  useEffect(() => {
    preloadAssets();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if(img.dataset.src) { // Check if data-src exists
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });

    return () => observer.disconnect();
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const debouncedScroll = debounce(handleScroll, 100);
    window.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedScroll);
  }, []);

  // Enhanced search suggestions with caching
  const fetchSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults(recentSearches.slice(0, 3));
      return;
    }

    setIsSearchLoading(true);
    try {
      const { data } = await api.get(
        `/s-suggestion`,
        {
          params: { q: query },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const enhancedResults = data.suggestions.map(item => ({
        ...item,
        score: calculateRelevanceScore(item, query)
      })).sort((a, b) => b.score - a.score).slice(0, 5);

      setSearchResults(enhancedResults);
    } catch (error) {
      if (api.isCancel(error)) return;
      console.error("Search error:", error);
      const cached = await getCachedSuggestions(query);
      if (cached) setSearchResults(cached);
    } finally {
      setIsSearchLoading(false);
    }
  }, [recentSearches]);

  const calculateRelevanceScore = (item, query) => {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    if (item.title) {
      const title = item.title.toLowerCase();
      queryTerms.forEach(term => {
        if (title.includes(term)) score += 3;
      });
    }

    if (item.description) {
      const desc = item.description.toLowerCase();
      queryTerms.forEach(term => {
        if (desc.includes(term)) score += 1;
      });
    }

    if (item.tags) {
      item.tags.forEach(tag => {
        queryTerms.forEach(term => {
          if (tag.toLowerCase().includes(term)) score += 2;
        });
      });
    }

    if (item.type === 'user') score += 1;

    return score;
  };

  const debouncedFetchSearch = useDebouncedCallback(
    (query) => fetchSearchSuggestions(query),
    300,
    { maxWait: 1000 }
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setActiveIndex(-1);
    debouncedFetchSearch(value);
  }, [debouncedFetchSearch]);

  const handleSearchEnter = useCallback((e) => {
    if (e.key === "Enter" && searchQuery.trim().length > 0) {
      e.preventDefault();
      setSearchBoxVisibility(false);
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        handleSuggestionClick(searchResults[activeIndex]);
      } else {
        navigate(`/search/${encodeURIComponent(searchQuery)}`);
        setRecentSearches(prev => [
          { query: searchQuery, type: 'search', timestamp: Date.now() },
          ...prev.filter(item => item.query !== searchQuery).slice(0, 4)
        ]);
        setSearchResults([]);
      }
    }
  }, [searchQuery, activeIndex, searchResults, navigate]);

  const handleSuggestionClick = useCallback((suggestion) => {
    let path = '';
    let state = {};
    switch (suggestion.type) {
      case 'post':
      case 'story':
        path = `/search/${encodeURIComponent(suggestion.title || suggestion.query)}`;
        break;
      case 'user':
        path = `/user/${suggestion.title}`;
        break;
      case 'tag':
        path = `/search/tag/${encodeURIComponent(suggestion.tag)}`;
        state = { searchedTag: suggestion.tag }; // Pass tag in state
        break;
      default:
        path = `/search/${encodeURIComponent(suggestion.title || suggestion.query)}`;
    }

    navigate(path, { state });
    setSearchQuery(suggestion.title || suggestion.query);
    setSearchResults([]);
    setSearchBoxVisibility(false);

    if (!suggestion.timestamp) {
      setRecentSearches(prev => [
        { ...suggestion, timestamp: Date.now() },
        ...prev.filter(item => item.title !== suggestion.title).slice(0, 4)
      ]);
    }
  }, [navigate]);

  const handleMobileSearchIconClick = useCallback(() => {
    setSearchBoxVisibility(prev => !prev);
    if (!searchBoxVisibility) {
      requestAnimationFrame(() => {
        mobileSearchRef.current?.focus();
      });
    }
  }, [searchBoxVisibility]);

  const handleCreateClick = () => {
    console.log("role:", role);
    if (role === 'editor') {
      navigate(`/editor`);
    } else {
      toast.error('Only editors are allowed to create posts. You can request editor access by contacting us.');
    }
  }

  // Notification fetch with cleanup
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNotifications = async () => {
      if (!access_token) return;

      try {
        const { data } = await api.get(
          `/new-notification`,
          {
            // No headers needed, interceptor adds it
            signal: controller.signal
          }
        );

        if (isMounted) {
          setUserAuth(prev => ({
            ...prev,
            new_notification_available: data.new_notification_available, // Use specific field from backend
            lastNotificationCheck: Date.now()
          }));
        }
      } catch (err) {
        if (err.name === 'CanceledError') return; // Ignore abort errors
        if (isMounted) {
          console.error("Notification error:", err);
        }
      }
    };

    if (!userAuth?.lastNotificationCheck ||
      Date.now() - userAuth.lastNotificationCheck > 300000) { // 5 minutes
      fetchNotifications();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [access_token, setUserAuth, userAuth?.lastNotificationCheck]);

  return (
    <>
      <Helmet>
        <title>{`${full_name || username || 'Welcome'} | Shumse`}</title>
        <meta name="description" content="Discover and share knowledge with our community" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>

      <LazyMotion features={domAnimation}>
        <div className="fixed top-0 left-0 right-0 z-50">
          <motion.nav
            className={`flex items-center px-4 py-3 transition-all duration-300 ${isScrolled
              ? "bg-white/90 dark:bg-dark-grey-2/90 backdrop-blur-xl shadow-md border-b border-gray-100 dark:border-grey"
              : "bg-white/20 dark:bg-dark-grey-2/20 backdrop-blur-md"
              }`}
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link to="/" className="flex-none w-[150px]" aria-label="Home">
              <img
                src={site_logo}
                alt="Site Logo"
                className="w-full h-auto dark:invert" // UI-IMPROVEMENT
                loading="eager"
                width="150"
                height="40"
              />
            </Link>

            {/* Desktop Search */}
            <div className="relative hidden md:block ml-6 flex-1 max-w-2xl" ref={desktopSearchRef}>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full bg-white/90 dark:bg-grey border border-gray-200 dark:border-grey rounded-full py-3 px-6 pr-12 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                  aria-label="Search"
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  onClick={() => searchQuery && handleSearchEnter({ key: 'Enter' })}
                  aria-label="Submit search"
                >
                  <i className="fi fi-rr-search text-xl"></i>
                </button>
              </div>

              {/* Search results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-dark-grey shadow-xl rounded-xl overflow-hidden z-30 border border-gray-100 dark:border-grey"
                    role="listbox"
                  >
                    {searchResults.map((suggestion, index) => (
                      <motion.li
                        key={`${suggestion.type}-${suggestion.title}-${index}`}
                        className={`px-4 py-3 cursor-pointer ${index === activeIndex ? 'bg-blue-50 dark:bg-grey' : 'hover:bg-gray-50 dark:hover:bg-grey'}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        role="option"
                        aria-selected={index === activeIndex}
                      >
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {suggestion.title}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
              {/* Mobile Search Icon */}
              <button
                className="md:hidden bg-gray-100 dark:bg-grey w-10 h-10 rounded-full flex items-center justify-center focus:outline-none transition-all duration-200"
                onClick={handleMobileSearchIconClick}
              >
                <i className="fi fi-rs-search text-xl text-dark-grey dark:text-light-grey"></i>
              </button>
              
              {/* Theme Toggle Button */}
              <ThemeToggleButton />

              {/* --- NEW COMMUNITY LINK (FIX: Show on mobile) --- */}
              <NavLink
                to="/readit/home"
                className={({ isActive }) =>
                  `flex items-center justify-center w-10 h-10 md:w-auto md:px-3 md:py-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-dark-grey dark:text-light-grey hover:bg-gray-100 dark:hover:bg-grey'
                  }`
                }
                onClick={() => setActivePage('Community')}
                aria-label="Community"
              >
                <i className="fi fi-rr-users-alt text-xl"></i>
                <span className="text-sm font-medium hidden md:inline ml-2">Community</span>
              </NavLink>
              {/* --- END NEW LINK --- */}

              {/* Create Button */}
              <button
                className="hidden md:flex gap-2 items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium"
                aria-label="Create Post"
                onClick={handleCreateClick}
              >
                <i className="fi fi-rr-file-edit"></i>
                <span className="hidden lg:inline">Create</span>
              </button>

              {/* User Profile & Notifications */}
              {access_token ? (
                <>
                {/* --- NOTIFICATION LINK FIX --- */}
                <NavLink
                  to="/dashboard/notifications"
                  onClick={() => {
                        setActivePage('Notification');
                        setSideNavOpen(false);
                    }}
                  className={({ isActive }) =>
                    `relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'text-dark-grey dark:text-light-grey hover:bg-gray-100 dark:hover:bg-grey'
                    }`
                  }
                  aria-label="Notifications"
                >
                  <i className="fi fi-rr-bell text-xl"></i>
                  {new_notification_available ? (
                    <span className="bg-red-500 rounded-full w-3 h-3 absolute z-10 top-1 right-1 border-2 border-white dark:border-dark-grey-2"></span>
                  ) : (
                    ""
                  )}
                </NavLink>
                {/* --- END NOTIFICATION LINK FIX --- */}

                <div className="relative">
                  <button
                    className="flex items-center gap-2"
                    onClick={() => setUserNavPanel(prev => !prev)}
                    aria-label="User menu"
                    aria-expanded={userNavPanel}
           >
                    <img
                      src={profile_img}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                      loading="lazy"
                    />
                  </button>

                  <AnimatePresence>
                    {userNavPanel && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2"
                        role="menu"
                      >
                        <UserNaivgationPanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
       </div>
                </>
              ) : (
                <>
                  <Link
                    className="btn-dark text-sm hidden md:block"
                    to="/signin"
                    aria-label="Sign in"
                  >
                    Sign In
                  </Link>
                <Link
                    className="btn-light text-sm hidden md:block"

                    to="/signup"
                    aria-label="Sign up"

                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.nav>

          {/* Mobile Search */}
          <AnimatePresence>
            {searchBoxVisibility && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-dark-grey-2 px-4 py-3 shadow-lg md:hidden border-b border-gray-100 dark:border-grey"
              >
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search..."
                    ref={mobileSearchRef}
                    className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-full py-3 px-6 pr-12 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchEnter}
                    aria-label="Mobile search"
                  />
                <i className="fi fi-rr-search absolute right-4 top-1/2 -translate-y-1/2 text-xl text-dark-grey dark:text-light-grey"></i>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>

      <div className="mt-[61px]"> {/* Adjusted for navbar height */}
        <Outlet />
      </div>
    </>
  );
};

export default React.memo(Navbar);