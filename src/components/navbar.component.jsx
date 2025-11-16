import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from "react";
import site_logo from "../imgs/logo.png";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { userContext } from "../App";
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
  const { userAuth, setUserAuth } = useContext(userContext);
  const { access_token, profile_img, full_name, username, role, new_notification_available } = userAuth || {};
  const navigate = useNavigate();
  const location = useLocation();

  // Preload assets on component mount
  useEffect(() => {
    preloadAssets();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
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
            headers: { Authorization: `Bearer ${access_token}` },
            signal: controller.signal
          }
        );

        if (isMounted) {
          setUserAuth(prev => ({
            ...prev,
            ...data,
            lastNotificationCheck: Date.now()
          }));
        }
      } catch (err) {
        if (isMounted && !api.isCancel(err)) {
          console.error("Notification error:", err);
        }
      }
    };

    if (!userAuth?.lastNotificationCheck ||
      Date.now() - userAuth.lastNotificationCheck > 300000) {
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
              ? "bg-white/90 backdrop-blur-xl shadow-md"
              : "bg-white/20 backdrop-blur-md"
              }`}
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link to="/" className="flex-none w-[150px]" aria-label="Home">
              <img
                src={site_logo}
                alt="Site Logo"
                className="w-full h-auto"
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
                  className="w-full bg-white/90 border border-gray-200 rounded-full py-3 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                  aria-label="Search"
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => searchQuery && handleSearchEnter({ key: 'Enter' })}
                  aria-label="Submit search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Search results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.ul
                    className="absolute left-0 right-0 mt-2 bg-white shadow-xl rounded-xl overflow-hidden z-30"
                    role="listbox"
                  >
                    {searchResults.map((suggestion, index) => (
                      <motion.li
                        key={`${suggestion.type}-${suggestion.title}`}
                        className={`px-4 py-3 cursor-pointer ${index === activeIndex ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">
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
            <div className="flex items-center gap-3 md:gap-6 ml-auto">
              {/* Mobile Search Icon */}
              <button
                className="md:hidden bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center focus:outline-none transition-all duration-200"
                onClick={handleMobileSearchIconClick}
              >
                <i className="fi fi-rs-search text-xl text-gray-700"></i>
              </button>
              {/* Theme Toggle Button */}
              <ThemeToggleButton />
  <NavLink
                    to="/dashboard/notifications"
                    onClick={() => {
                        setActivePage('Notification');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link relative flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-bell text-xl"></i>                  {
                        new_notification_available ? <span className="bg-red rounded-full w-3 h-3 absolute z-10 top-2 left-2"></span> : ""
                    }

                    


                </NavLink>
              {/* Create Button - Fixed to use <button> */}
              <button
                className="hidden md:flex gap-2 items-center px-3 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
                aria-label="Create Post"
                onClick={handleCreateClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create
              </button>

              {/* User Profile */}
              {access_token ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-2"
                    onClick={() => setUserNavPanel(prev => !prev)}
                    aria-label="User menu"
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
                        className="absolute right-0 mt-2"
                        role="menu"
                      >
                        <UserNaivgationPanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
                    to="/signin"
                    aria-label="Sign in"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.nav>

          {/* Mobile Search */}
          <AnimatePresence>
            {searchBoxVisibility && (
              <motion.div
                className="bg-white px-4 py-3 shadow-lg md:hidden"
              >
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search..."
                    ref={mobileSearchRef}
                    className="w-full bg-gray-100 border border-blue-300 rounded-full py-3 px-6 pr-12 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchEnter}
                    aria-label="Mobile search"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>

      <div className="mt-20">
        <Outlet />
      </div>
    </>
  );
};

async function getCachedSuggestions(query) {
  return [];
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default React.memo(Navbar);