import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import UserNavigationPanel from "./UserNavigation";
import api from "../common/api";
import { LazyMotion, domAnimation, motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import ThemeToggleButton from "./ThemeToggleButton";
import OptimizedImage from "./OptimizedImage";
import site_logo from "../../public/readit.png"
const preloadAssets = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = '/logo.png';
  document.head.appendChild(link);
};

const Navbar = () => {
  const navigate = useNavigate();
  const { userAuth, setUserAuth } = useContext(UserContext);
  const { access_token, profile_img, new_notification_available } = userAuth || {};

  

  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Preload assets
  useEffect(() => {
    preloadAssets();
  }, []);

  // Scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 10;
          setIsScrolled(prev => prev !== scrolled ? scrolled : prev);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search effect
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearchLoading(true);
      try {
        const { data } = await api.get('/s-suggestion', {
          params: { q: debouncedSearchQuery }
        });

        const enhancedResults = data.suggestions.map((item, idx) => ({
          ...item,
          id: item._id || `${item.type}-${item.title}-${idx}`,
        })).slice(0, 5);

        setSearchResults(enhancedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setActiveIndex(-1);
  };

  const handleSearchEnter = (e) => {
    if (e.key === "Enter" && searchQuery.trim().length > 0) {
      e.preventDefault();
      setSearchBoxVisibility(false);
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        handleSuggestionClick(searchResults[activeIndex]);
      } else {
        navigate(`/search/${encodeURIComponent(searchQuery)}`);
        setSearchResults([]);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    let path = '';
    let state = {};
    switch (suggestion.type) {
      case 'user': path = `/user/${suggestion.title}`; break;
      case 'tag':
        path = `/search/tag/${encodeURIComponent(suggestion.tag)}`;
        state = { searchedTag: suggestion.tag };
        break;
      default: path = `/search/${encodeURIComponent(suggestion.title || suggestion.query)}`;
    }

    navigate(path, { state });
    setSearchQuery(suggestion.title || suggestion.query);
    setSearchResults([]);
    setSearchBoxVisibility(false);
  };

  // Notification fetch logic (FIXED)
  useEffect(() => {
    if (!access_token) return;

    const checkNotifications = async () => {
      try {
        const { data } = await api.get('/new-notification');
        setUserAuth(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error(err);
      }
    };

    checkNotifications();
    // Optional: Add interval logic here if needed
  }, [access_token, setUserAuth]);

  return (
    <>
      <LazyMotion features={domAnimation}>
        <div className={`z-10 sticky top-0 w-full transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-dark-grey/80 backdrop-blur-md border-b border-gray-100 dark:border-grey' : 'bg-white dark:bg-dark-grey'}`}>
          <motion.nav
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="navbar w-full flex items-center gap-12 px-[5vw] py-5 h-[80px]"
          >
            {/* Logo */}
            <Link to="/" className="w-12 block flex-none">
            <h1 className=" md:flex gap-2 items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-full text-sm font-large shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">Read</h1>
            {/* <img src={site_logo} alt="Readit" className="w-cover" /> */}
            </Link>

            {/* Desktop Search Bar Container */}
            <div className="absolute bg-white dark:bg-dark-grey w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show pointer-events-auto transition-all duration-300">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  ref={desktopSearchRef}
                  className="w-full md:w-auto bg-gray-100 dark:bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey/50 md:pl-12 outline-none focus:bg-transparent transition-all border border-transparent focus:border-gray-200 dark:focus:border-grey"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                />

                {/* Search Button (Restored from error location) */}
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                  aria-label="Submit search"
                  onClick={() => handleSearchEnter({ key: 'Enter', preventDefault: () => { } })}
                >
                  <i className="fi fi-rr-search text-xl"></i>
                </button>
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-dark-grey shadow-xl rounded-xl overflow-hidden z-30 border border-gray-100 dark:border-grey md:w-[150%]"
                    role="listbox"
                  >
                    {searchResults.map((suggestion, index) => (
                      <li
                        key={suggestion.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-grey focus:bg-gray-50 dark:focus:bg-grey outline-none`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        role="option"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSuggestionClick(suggestion);
                        }}
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.title}</p>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Right Nav */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
              <button
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-grey hover:bg-gray-200 dark:hover:bg-dark-grey transition-colors"
                onClick={() => setSearchBoxVisibility(!searchBoxVisibility)}
                aria-label="Toggle search"
                aria-expanded={searchBoxVisibility}
              >
                <i className="fi fi-rs-search text-xl"></i>
              </button>

              <ThemeToggleButton />

              <NavLink
                to="/readit"
                className={({ isActive }) => `flex items-center justify-center w-10 h-10 md:w-auto md:px-3 md:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-grey text-dark-grey dark:text-light-grey transition-colors ${isActive ? 'text-primary dark:text-primary bg-primary/10' : ''}`}
                aria-label="Community"
              >
                <i className="fi fi-rr-users-alt text-xl"></i>
                <span className="text-sm font-medium hidden md:inline ml-2">Community</span>
              </NavLink>

              <Link
                to="/editor"
                className="hidden md:flex gap-2 items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                aria-label="Create new post"
              >
                <i className="fi fi-rr-file-edit"></i>
                <span className="hidden lg:inline">Create</span>
              </Link>

              {access_token ? (
                <>
                  <NavLink
                    to="/dashboard/notifications"
                    className={({ isActive }) => `relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-grey transition-colors ${isActive ? 'text-primary bg-primary/10' : ''}`}
                    aria-label="Notifications"
                  >
                    <i className="fi fi-rr-bell text-xl"></i>
                    {new_notification_available && <span className="bg-error rounded-full w-3 h-3 absolute top-1 right-1 border-2 border-white dark:border-dark-grey"></span>}
                  </NavLink>

                  <div className="relative">
                    <button
                      onClick={() => setUserNavPanel(prev => !prev)}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="User menu"
                      aria-expanded={userNavPanel}
                    >
                      <OptimizedImage src={profile_img} alt="Profile" className="w-full h-full object-cover" />
                    </button>
                    <AnimatePresence>
                      {userNavPanel && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2"
                        >
                          <UserNavigationPanel />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/signin" className="btn-dark text-sm hidden md:block hover:bg-black/80 transition-colors">Sign In</Link>
                  <Link to="/signup" className="btn-light text-sm hidden md:block hover:bg-gray-200 transition-colors">Sign Up</Link>
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
                    className="w-full bg-gray-100 dark:bg-grey dark:border  border border-gray-200 dark:border-gray-200 dark:rounded-full rounded-full py-3 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchEnter}
                    aria-label="Mobile search"
                  />
                  <i className="fi fi-rr-search absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>
      <div id="main-content" className="  focus:outline-none" tabIndex="-1"><Outlet /></div>
    </>
  );
};

export default React.memo(Navbar);