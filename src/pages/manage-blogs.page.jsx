import api from "../common/api";
import { useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "../App";
import { FilterPagination } from "../common/filter-pagination-data";
import { Toaster } from "react-hot-toast";
import InPageNavigation from "../components/InPageNavigation";
import Loader from "../components/Loader";
import AnimationWrapper from "../common/page-animation";
import { PostManCard, DraftManCard } from "../components/ManageBlogCard";
import { FiSearch, FiEdit3 } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const ManageBlog = () => {
    const { userAuth: { access_token } } = useContext(UserContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("Published");
    const [searchQuery, setSearchQuery] = useState("");

    const [blobs, setBlobs] = useState({
        "Published": { results: [], page: 1, totalDocs: 0, deleteDocCount: 0 },
        "Drafts": { results: [], page: 1, totalDocs: 0, deleteDocCount: 0 },
        "Stories": { results: [], page: 1, totalDocs: 0, deleteDocCount: 0 }
    });

    const [loading, setLoading] = useState(false);

    // Dynamic API endpoint and params based on active tab
    const getFetchConfig = useCallback((tab, query, page) => {
        if (tab === "Stories") {
            return {
                route: "/get-user-stories",
                params: { page, query },
                isStory: true
            };
        }

        const isDraft = tab === "Drafts";
        return {
            route: "/get-user-blogs",
            params: {
                page,
                draft: isDraft,
                query,
                deletedDocCount: blobs[tab].deleteDocCount
            },
            isStory: false
        };
    }, [blobs]);


    const fetchBlogs = useCallback(async ({ page = 1, tab = activeTab, query = searchQuery }) => {
        // If we don't have a token yet, wait (App.jsx handles redirection if not logged in eventually)
        if (!access_token) return;

        setLoading(true);
        const { route, params, isStory } = getFetchConfig(tab, query, page);

        try {
            // Relies on api.jsx interceptor for Authorization header
            const { data } = await api.post(route, params);

            const arr_data = isStory ? (data.stories || []) : (data.blogs || []);
            const countRoute = isStory ? "/get-user-stories-count" : "/get-user-blogs-count";
            const data_to_send = isStory ? { query } : { draft: params.draft, query };

            const formattedData = await FilterPagination({
                state: blobs[tab],
                arr_data,
                page,
                countRoute,
                data_to_send,
                user: access_token
            });

            setBlobs(prev => ({ ...prev, [tab]: formattedData }));

        } catch (err) {
            console.error(`Error fetching ${tab}:`, err);
        } finally {
            setLoading(false);
        }
    }, [access_token, activeTab, searchQuery, getFetchConfig, blobs]);


    // Initial Fetch & Search Fetch
    useEffect(() => {
        if (access_token) {
            if (searchQuery !== "") {
                // Reset and fetch if searching
                setBlobs(prev => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], results: [], page: 1 }
                }));
                fetchBlogs({ page: 1, tab: activeTab, query: searchQuery });
            } else {
                // Only fetch if empty to avoid double fetching usually, but logic here ensures we fill data
                if (blobs[activeTab].results.length === 0) {
                    fetchBlogs({ page: 1, tab: activeTab, query: "" });
                }
            }
        }
    }, [access_token, activeTab, searchQuery, blobs, fetchBlogs]);


    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            // Search is reactive to state change in useEffect
        }
    }

    const loadMore = () => {
        const currentTabState = blobs[activeTab];
        // Only fetch if we have more docs than currently loaded
        if (currentTabState.results.length < currentTabState.totalDocs) {
            fetchBlogs({ page: currentTabState.page + 1 });
        }
    }

    // Helper to update state from child components (delete)
    const setTabState = (updater, tabName = activeTab) => {
        setBlobs(prev => {
            const newVal = updater(prev[tabName]);
            return { ...prev, [tabName]: newVal };
        });
    }

    // Check if user is logged in (optional, but good for redirect)
    useEffect(() => {
        if (access_token === null) {
            // If explicitly null (logged out), redirect
            navigate('/signin');
        }
    }, [access_token, navigate]);


    return (
        <AnimationWrapper>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
                <Toaster />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 ml-10 lg:ml-0">
                            Manage Blogs
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 ml-10 lg:ml-0">
                            Create, edit, and manage your content efficiently.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-64 group">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={handleSearch}
                                onKeyDown={handleKeyDown}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-[#212121] border-transparent focus:bg-white dark:focus:bg-[#212121] border focus:border-gray-300 dark:focus:border-gray-700 outline-none transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                            />
                            <FiSearch className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-200 transition-colors" size={18} />
                        </div>

                        {/* Create Button */}
                        <Link to="/editor" className="hidden md:flex items-center justify-center w-10 h-10 md:w-auto md:px-4 md:py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <FiEdit3 className="md:mr-2" size={20} />
                            <span className="hidden md:inline font-medium">Write</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Floating Action Button */}
                <Link to="/editor" className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform" aria-label="Create new blog">
                    <FiEdit3 size={24} />
                </Link>

                {/* Tabs & Content */}
                <InPageNavigation
                    routes={["Published", "Drafts", "Stories"]}
                    defaultActiveIndex={0}
                    defaultHidden={[]}
                    onRouteChange={(newTab) => setActiveTab(newTab)}
                >

                    {/* PUBLISHED */}
                    <BlogList
                        type="Published"
                        state={blobs["Published"]}
                        fetchMore={loadMore}
                        loading={loading && activeTab === 'Published'}
                        setStateFunc={(val) => setTabState(val, "Published")}
                    />

                    {/* DRAFTS */}
                    <BlogList
                        type="Drafts"
                        state={blobs["Drafts"]}
                        fetchMore={loadMore}
                        loading={loading && activeTab === 'Drafts'}
                        setStateFunc={(val) => setTabState(val, "Drafts")}

                    />

                    {/* STORIES */}
                    <BlogList
                        type="Stories"
                        state={blobs["Stories"]}
                        fetchMore={loadMore}
                        loading={loading && activeTab === 'Stories'}
                        setStateFunc={(val) => setTabState(val, "Stories")}
                    />

                </InPageNavigation>

            </div>
        </AnimationWrapper>
    );
};

// Sub-component for listing blogs
const BlogList = ({ type, state, fetchMore, loading, setStateFunc }) => {

    return (
        <div className="py-6">
            {state.results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        {type === "Drafts" ? <FiEdit3 size={32} className="text-gray-400" /> : <FiSearch size={32} className="text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">No {type.toLowerCase()} found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                        {type === "Published" ? "Start writing your first blog post today!" : "You don't have nothing in drafts."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {state.results.map((blog, i) => (
                        <AnimationWrapper key={i} transition={{ delay: i * 0.05 }}>
                            {type === "Drafts" ? (
                                <DraftManCard
                                    blog={{ ...blog, index: i, setStateFuc: setStateFunc }}
                                />
                            ) : (
                                <PostManCard
                                    blog={{ ...blog, index: i, setStateFuc: setStateFunc }}
                                />
                            )}
                        </AnimationWrapper>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-10">
                    <Loader />
                </div>
            )}

            {/* Load More Button */}
            {state.totalDocs > state.results.length && !loading && (
                <button
                    onClick={fetchMore}
                    className="w-full py-3 mt-8 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                    Load More
                </button>
            )}
        </div>
    );
}

export default ManageBlog;
