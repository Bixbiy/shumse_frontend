import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../App";
import UserNavigationPanel from "./UserNavigation";
import api from "../common/api";
import { LazyMotion, domAnimation, motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import OptimizedImage from "./OptimizedImage";
import NestedNavbar from "./NestedNavbar";
import VerificationBadge from "./VerificationBadge";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userAuth, setUserAuth } = useContext(UserContext);
  const { access_token, profile_img, new_notification_available } = userAuth || {};

  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Dynamic Navigation Logic
  const isReaditPage = location.pathname.startsWith("/readit");

  const navLinks = isReaditPage
    ? [
      { path: "/readit/home", label: "Home", icon: "fi-rr-home" },
      { path: "/readit/create-community", label: "Create Community", icon: "fi-rr-users-medical" },
      { path: "/readit/create-post", label: "Create Post", icon: "fi-rr-edit" },
    ]
    : [
      { path: "/games", label: "Games", icon: "fi-rr-console-alt" },
      { path: "/readit", label: "Community", icon: "fi-rr-users-alt" },
      { path: "/editor", label: "Create", icon: "fi-rr-file-edit" },
    ];

  // Scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 10;
          setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
        const { data } = await api.get("/s-suggestion", {
          params: { q: debouncedSearchQuery },
        });

        const enhancedResults = data.suggestions
          .map((item, idx) => ({
            ...item,
            id: item._id || `${item.type}-${item.title}-${idx}`,
          }))
          .slice(0, 5);

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
    let path = "";
    let state = {};
    switch (suggestion.type) {
      case "user":
        path = `/user/${suggestion.title}`;
        break;
      case "tag":
        path = `/search/tag/${encodeURIComponent(suggestion.tag)}`;
        state = { searchedTag: suggestion.tag };
        break;
      default:
        path = `/search/${encodeURIComponent(suggestion.title || suggestion.query)}`;
    }

    navigate(path, { state });
    setSearchQuery(suggestion.title || suggestion.query);
    setSearchResults([]);
    setSearchBoxVisibility(false);
  };

  // Notification fetch logic
  useEffect(() => {
    if (!access_token) return;

    const checkNotifications = async () => {
      try {
        const { data } = await api.get("/new-notification");
        setUserAuth(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error(err);
      }
    };

    checkNotifications();
  }, [access_token, setUserAuth]);

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={`z-50 sticky top-0 w-full transition-all duration-300 ${isScrolled
          ? "bg-white/80 dark:bg-dark-grey/80 backdrop-blur-md border-b border-gray-100 dark:border-grey"
          : "bg-white dark:bg-dark-grey"
          }`}
      >
        <motion.nav
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="navbar w-full flex items-center justify-between px-[5vw] py-4 h-[80px]"
        >
          {/* Logo & Branding */}
          <div className="flex items-center gap-4">
            <Link to="/" className="w-12 block flex-none">
              <h1 className="flex items-center justify-center py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">
                Shums
              </h1>
            </Link>
          </div>

          {/* Desktop Nested Navbar - Centered or merged with search? 
                        Let's keep it next to logo or separate. 
                        Design choice: Keep links visible on desktop, hidden on mobile. */}
          <div className="hidden md:flex items-center gap-6 ml-6">
            <NestedNavbar links={navLinks} />
          </div>


          {/* Search Bar Container - Desktop */}
          <div className="hidden md:block relative ml-auto mr-4">
            <input
              type="search"
              placeholder="Search..."
              ref={desktopSearchRef}
              className="w-full bg-gray-100 dark:bg-grey p-3 pl-5 pr-12 rounded-full placeholder:text-dark-grey/50 outline-none focus:bg-transparent transition-all border border-transparent focus:border-gray-200 dark:focus:border-grey text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchEnter}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
              onClick={() => handleSearchEnter({ key: 'Enter', preventDefault: () => { } })}
            >
              <i className="fi fi-rr-search text-lg"></i>
            </button>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 bg-white dark:bg-dark-grey shadow-xl rounded-xl overflow-hidden z-30 border border-gray-100 dark:border-grey w-[120%]"
                >
                  {searchResults.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-grey"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex flex-col">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {suggestion.title}
                        </p>
                        {(suggestion.fullname || suggestion.personal_info?.fullname || suggestion.name) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {suggestion.fullname || suggestion.personal_info?.fullname || suggestion.name}
                            {suggestion.personal_info?.isVerified && <VerificationBadge size={12} />}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>


          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Toggle */}
            <button
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-grey hover:bg-gray-200 dark:hover:bg-dark-grey transition-colors"
              onClick={() => setSearchBoxVisibility(!searchBoxVisibility)}
              aria-label="Toggle search"
            >
              <i className="fi fi-rs-search text-xl"></i>
            </button>

            {/* Hamburger Menu Toggle - Mobile */}
            <button
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-grey hover:bg-gray-200 dark:hover:bg-dark-grey transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <i className={`fi ${mobileMenuOpen ? 'fi-rr-cross' : 'fi-rr-menu-burger'} text-xl transition-all`}></i>
            </button>

            {/* Desktop User Nav */}
            <div className="hidden md:flex items-center gap-4">
              {access_token ? (
                <>
                  <NavLink
                    to="/dashboard/notifications"
                    className={({ isActive }) =>
                      `relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-grey transition-colors ${isActive ? "text-primary bg-primary/10" : "text-dark-grey dark:text-light-grey"
                      }`
                    }
                  >
                    <i className="fi fi-rr-bell text-xl"></i>
                    {new_notification_available && (
                      <span className="bg-red-500 rounded-full w-3 h-3 absolute top-1 right-1 border-2 border-white dark:border-dark-grey"></span>
                    )}
                  </NavLink>

                  <div className="relative">
                    <button
                      onClick={() => setUserNavPanel(prev => !prev)}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                    >
                      <OptimizedImage
                        src={profile_img}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <AnimatePresence>
                      {userNavPanel && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 z-50"
                        >
                          <UserNavigationPanel />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link to="/signin" className="btn-dark text-sm px-6 py-2 rounded-full">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </motion.nav>

        {/* Mobile Search Bar Expand */}
        <AnimatePresence>
          {searchBoxVisibility && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white dark:bg-dark-grey-2 px-4 py-3 shadow-lg md:hidden border-b border-gray-100 dark:border-grey"
            >
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  ref={mobileSearchRef}
                  className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-gray-700 rounded-full py-3 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                />
                <i className="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-[80px] left-0 w-full bg-white dark:bg-dark-grey shadow-xl md:hidden z-40 border-b border-gray-100 dark:border-grey p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu</h3>
                <NestedNavbar links={navLinks} />
              </div>

              <div className="border-t border-gray-100 dark:border-grey pt-4 mt-2">
                {access_token ? (
                  <div className="flex flex-col gap-4">
                    <Link to={`/user/${userAuth?.username}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-grey rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <OptimizedImage src={profile_img} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-dark-grey dark:text-white flex items-center gap-1">
                          Profile
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          @{userAuth?.username}
                          {userAuth?.personal_info?.isVerified && <VerificationBadge size={12} />}
                        </span>
                      </div>
                    </Link>
                    <Link to="/dashboard/notifications" className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-grey rounded-lg text-dark-grey dark:text-white">
                      <i className="fi fi-rr-bell text-xl"></i>
                      <span>Notifications</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/signin" className="btn-dark w-full text-center py-3 rounded-full">Sign In</Link>
                    <Link to="/signup" className="btn-light w-full text-center py-3 rounded-full bg-gray-100 dark:bg-grey">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};

export default React.memo(Navbar);