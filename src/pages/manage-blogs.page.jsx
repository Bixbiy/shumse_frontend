// manage-blogs.page.jsx

import axios from "axios";
import { useContext, useState, useEffect, useCallback } from "react";
import { userContext } from "../App";
import { FilterPagination } from "../common/filter-pagination-data";
import { Toaster } from "react-hot-toast";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import { PostManCard, DraftManCard } from "../components/manage-blogcard.component";

const TABS = ["Published Posts", "Drafts", "Stories"];

const ManageBlog = () => {
    const {
        userAuth: { access_token },
    } = useContext(userContext);

    //
    // ─── Local State & Loading Flags ───────────────────────────────────────────────
    //
    const [activeTabIndex, setActiveTabIndex] = useState(0); // 0 = Published, 1 = Drafts, 2 = Stories

    // Search query (triggered when user presses Enter). When `query` changes, we re-fetch both sets.
    const [searchQuery, setSearchQuery] = useState("");

    // Published posts state:
    const [publishedData, setPublishedData] = useState({
        results: [],
        page: 1,
        totalPages: 1,
        totalDocs: 0,
    });
    const [isLoadingPublished, setIsLoadingPublished] = useState(false);
    const [errorPublished, setErrorPublished] = useState(null);

    // Drafts state:
    const [draftData, setDraftData] = useState({
        results: [],
        page: 1,
        totalPages: 1,
        totalDocs: 0,
    });
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    const [errorDrafts, setErrorDrafts] = useState(null);

    // (Optional) Placeholder for “Stories” -- you can implement similarly later.
    const [storyData, setStoryData] = useState({
        results: [],
        page: 1,
        totalPages: 1,
        totalDocs: 0,
    });
    const [isLoadingStories, setIsLoadingStories] = useState(false);
    const [errorStories, setErrorStories] = useState(null);

    //
    // ─── Fetch Functions ────────────────────────────────────────────────────────────
    //
    const fetchPublished = useCallback(
        async (pageNumber = 1) => {
            if (!access_token) return;
            setIsLoadingPublished(true);
            setErrorPublished(null);

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_DOMAIN}/get-user-blogs`,
                    {
                        page: pageNumber,
                        draft: false,
                        query: searchQuery,
                        deletedDocCount: 0,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    }
                );

                // Assume FilterPagination returns an object with { results, page, totalPages, totalDocs }
                const formatted = await FilterPagination({
                    state: publishedData,
                    arr_data: data.blogs,
                    page: pageNumber,
                    user: access_token,
                    countRoute: "/get-user-blogs-count",
                    data_to_send: { draft: false, query: searchQuery },
                });

                setPublishedData(formatted);
            } catch (err) {
                console.error("Error fetching published posts:", err);
                setErrorPublished("Failed to load published posts. Please try again.");
            } finally {
                setIsLoadingPublished(false);
            }
        },
        [access_token, searchQuery]
    );

    const fetchDrafts = useCallback(
        async (pageNumber = 1) => {
            if (!access_token) return;
            setIsLoadingDrafts(true);
            setErrorDrafts(null);

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_DOMAIN}/get-user-blogs`,
                    {
                        page: pageNumber,
                        draft: true,
                        query: searchQuery,
                        deletedDocCount: 0,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    }
                );

                const formatted = await FilterPagination({
                    state: draftData,
                    arr_data: data.blogs,
                    page: pageNumber,
                    user: access_token,
                    countRoute: "/get-user-blogs-count",
                    data_to_send: { draft: true, query: searchQuery },
                });

                setDraftData(formatted);
            } catch (err) {
                console.error("Error fetching drafts:", err);
                setErrorDrafts("Failed to load draft posts. Please try again.");
            } finally {
                setIsLoadingDrafts(false);
            }
        },
        [access_token, searchQuery]
    );

    // (Optional) If you later implement “Stories,” do something similar to fetchPublished/fetchDrafts:
    const fetchStories = useCallback(async (pageNumber = 1) => {
        if (!access_token) return;
        setIsLoadingStories(true);
        setErrorStories(null);
        try {
            // Placeholder: replace endpoint /get-user-stories if you build it
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/get-user-stories`,
                { page: pageNumber, query: searchQuery },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            );

            const formatted = {
                results: data.stories || [],
                page: pageNumber,
                totalPages: data.totalPages || 1,
                totalDocs: data.totalDocs || data.stories.length || 0,
            };

            setStoryData(formatted);
        } catch (err) {
            console.error("Error fetching stories:", err);
            setErrorStories("Failed to load stories. Please try again.");
        } finally {
            setIsLoadingStories(false);
        }
    }, [access_token, searchQuery]);

    //
    // ─── Effects ───────────────────────────────────────────────────────────────────
    //
    // 1) On initial mount or whenever the access_token or searchQuery changes, re‐fetch page 1
    useEffect(() => {
        if (!access_token) return;

        // Whenever query or token changes, reset to page 1 and refetch
        setPublishedData((prev) => ({ ...prev, page: 1 }));
        setDraftData((prev) => ({ ...prev, page: 1 }));
        setStoryData((prev) => ({ ...prev, page: 1 }));

        // Fetch page 1 for each category
        fetchPublished(1);
        fetchDrafts(1);
        // We leave Stories empty for now; if/when you implement it, call `fetchStories(1)`.
    }, [access_token, searchQuery, fetchPublished, fetchDrafts, fetchStories]);

    //
    // 2) Paginated fetch: Whenever publishedData.page changes (and is > 1), fetch new page.
    useEffect(() => {
        if (
            access_token &&
            publishedData.page > 1 &&
            publishedData.page <= publishedData.totalPages
        ) {
            fetchPublished(publishedData.page);
        }
    }, [access_token, publishedData.page, publishedData.totalPages, fetchPublished]);

    // 3) Paginated fetch for drafts
    useEffect(() => {
        if (
            access_token &&
            draftData.page > 1 &&
            draftData.page <= draftData.totalPages
        ) {
            fetchDrafts(draftData.page);
        }
    }, [access_token, draftData.page, draftData.totalPages, fetchDrafts]);

    // 4) (Optional) Paginated fetch for stories
    useEffect(() => {
        if (
            access_token &&
            storyData.page > 1 &&
            storyData.page <= storyData.totalPages
        ) {
            fetchStories(storyData.page);
        }
    }, [access_token, storyData.page, storyData.totalPages, fetchStories]);

    //
    // ─── Event Handlers ────────────────────────────────────────────────────────────
    //
    const handleSearchInput = (e) => {
        setSearchQuery(e.target.value.trim());
        // Note: We only re‐fetch when the user actually presses Enter (below).
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            // If the query is non‐empty, we trigger the top‐level effect (because searchQuery changed)
            // If it’s empty, we also reset (since searchQuery is already updated)
            // (Above useEffect will fire automatically.)
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handlePublishedPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= publishedData.totalPages) {
            setPublishedData((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleDraftsPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= draftData.totalPages) {
            setDraftData((prev) => ({ ...prev, page: newPage }));
        }
    };

    // (Optional) If you implement stories pagination:
    const handleStoriesPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= storyData.totalPages) {
            setStoryData((prev) => ({ ...prev, page: newPage }));
        }
    };

    //
    // ─── Render Helpers ────────────────────────────────────────────────────────────
    //

    const renderPublishedTab = () => {
        if (isLoadingPublished) {
            return <Loader />;
        }
        if (errorPublished) {
            return <p className="text-red-600">{errorPublished}</p>;
        }
        if (!publishedData.results.length) {
            return <p>No published posts found.</p>;
        }

        return (
            <>
                <div className="space-y-4">
                    {publishedData.results.map((blog, idx) => (
                        <AnimationWrapper
                            key={blog._id || idx}
                            transition={{ delay: idx * 0.04 }}
                        >
                            <PostManCard
                                blog={{
                                    ...blog,
                                    index: idx,
                                    setStateFuc: setPublishedData,
                                }}
                            />
                        </AnimationWrapper>
                    ))}
                </div>

                {/* Pagination Controls (Basic “Previous / Next”). You can enhance to numeric page buttons if desired. */}
                <div className="mt-6 flex justify-center items-center space-x-4">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handlePublishedPageChange(publishedData.page - 1)}
                        disabled={publishedData.page <= 1 || isLoadingPublished}
                    >
                        Previous
                    </button>
                    <span>
                        Page {publishedData.page} of {publishedData.totalPages}
                    </span>
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handlePublishedPageChange(publishedData.page + 1)}
                        disabled={publishedData.page >= publishedData.totalPages || isLoadingPublished}
                    >
                        Next
                    </button>
                </div>
            </>
        );
    };

    const renderDraftsTab = () => {
        if (isLoadingDrafts) {
            return <Loader />;
        }
        if (errorDrafts) {
            return <p className="text-red-600">{errorDrafts}</p>;
        }
        if (!draftData.results.length) {
            return <p>No Draft posts found.</p>;
        }

        return (
            <>
                <div className="space-y-4">
                    {draftData.results.map((blog, idx) => (
                        <AnimationWrapper
                            key={blog._id || idx}
                            transition={{ delay: idx * 0.04 }}
                        >
                            <DraftManCard
                                blog={{
                                    ...blog,
                                    index: idx,
                                    setStateFuc: setDraftData,
                                }}
                            />
                        </AnimationWrapper>
                    ))}
                </div>

                <div className="mt-6 flex justify-center items-center space-x-4">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handleDraftsPageChange(draftData.page - 1)}
                        disabled={draftData.page <= 1 || isLoadingDrafts}
                    >
                        Previous
                    </button>
                    <span>
                        Page {draftData.page} of {draftData.totalPages}
                    </span>
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handleDraftsPageChange(draftData.page + 1)}
                        disabled={draftData.page >= draftData.totalPages || isLoadingDrafts}
                    >
                        Next
                    </button>
                </div>
            </>
        );
    };

    const renderStoriesTab = () => {
        if (isLoadingStories) {
            return <Loader />;
        }
        if (errorStories) {
            return <p className="text-red-600">{errorStories}</p>;
        }
        if (!storyData.results.length) {
            return <p>No stories found (coming soon!).</p>;
        }

        return (
            <>
                <div className="space-y-4">
                    {storyData.results.map((story, idx) => (
                        <AnimationWrapper
                            key={story._id || idx}
                            transition={{ delay: idx * 0.04 }}
                        >
                            {/* Replace <PostManCard> with a <StoryCard> once you build it */}
                            <PostManCard
                                blog={{
                                    ...story,
                                    index: idx,
                                    setStateFuc: setStoryData,
                                }}
                            />
                        </AnimationWrapper>
                    ))}
                </div>

                <div className="mt-6 flex justify-center items-center space-x-4">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handleStoriesPageChange(storyData.page - 1)}
                        disabled={storyData.page <= 1 || isLoadingStories}
                    >
                        Previous
                    </button>
                    <span>
                        Page {storyData.page} of {storyData.totalPages}
                    </span>
                    <button
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => handleStoriesPageChange(storyData.page + 1)}
                        disabled={storyData.page >= storyData.totalPages || isLoadingStories}
                    >
                        Next
                    </button>
                </div>
            </>
        );
    };

    //
    // ─── Main Render ───────────────────────────────────────────────────────────────
    //
    return (
        <>
            <h1 className="hidden md:block text-3xl font-semibold mb-6">
                Manage Posts
            </h1>
            <Toaster />

            {/* ── Search Input ─────────────────────────────────────────────────────── */}
            <div className="relative max-w-md mx-auto mb-8">
                <input
                    type="search"
                    value={searchQuery}
                    placeholder="Search Posts"
                    className="w-full px-4 py-3 rounded-full border-2 border-black placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                    onChange={handleSearchInput}
                    onKeyDown={handleSearchKeyDown}
                />
                {searchQuery && (
                    <button
                        className="absolute right-4 top-2.5 text-gray-600"
                        onClick={clearSearch}
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
                <i className="fi fi-rr-search absolute left-4 top-3 text-xl pointer-events-none"></i>
            </div>

            {/* ── Tab Navigation & Content ──────────────────────────────────────────── */}
            <InPageNavigation
                routes={TABS}
                activeIndex={activeTabIndex}
                onTabChange={setActiveTabIndex}
            >
                {/* ── Published Posts Tab ───────────────────────────────────────────── */}
                {renderPublishedTab()}

                {/* ── Drafts Tab ────────────────────────────────────────────────────── */}
                {renderDraftsTab()}

                {/* ── Stories Tab ───────────────────────────────────────────────────── */}
                {renderStoriesTab()}
            </InPageNavigation>
        </>
    );
};

export default ManageBlog;
