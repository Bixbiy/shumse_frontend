/*
 * MODIFIED FILE - FIXED AUTH RACE CONDITION + OPTIMIZED CONTEXT
 * Path: src/App.jsx
 */
import React, { useState, useEffect, createContext, lazy, Suspense, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import { lookInSession } from "./common/session";
import { setAuthToken } from "./common/api";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppLayout from "./components/layout/AppLayout";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import SideNav from "./components/SideNav";
import UserAuthForm from "./pages/userAuthForm.page";
import HomePage from "./pages/home.page";
import NotFound from "./pages/404.page";
import SEO from "./common/seo";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// LAZY LOADED PAGES (loaded on demand)
const ProfilePage = lazy(() => import("./pages/profile.page"));
const BlogPage = lazy(() => import("./pages/blog.page"));
const SearchPage = lazy(() => import("./pages/search.page"));
const ContactPage = lazy(() => import("./pages/Contact.page"));
const Editor = lazy(() => import("./pages/editor.pages"));

// LAZY LOADED SETTINGS & DASHBOARD
const ChangePassword = lazy(() => import("./pages/change-password.page"));
const EditProfile = lazy(() => import("./pages/edit-profile.page"));
const Notifications = lazy(() => import("./pages/notifications.page"));
const ManageBlog = lazy(() => import("./pages/manage-blogs.page"));

// LAZY LOADED STORY FEATURES
const StoryEditor = lazy(() => import("./pages/StoryEditor"));
const StoriesList = lazy(() => import("./components/StoriesList"));
const StoryViewerModal = lazy(() => import("./components/StoryViewer"));

// LAZY LOADED READIT PAGES
const ReaditHomePage = lazy(() => import('./pages/ReaditHomePage'));
const ReaditCommunityPage = lazy(() => import('./pages/ReaditCommunityPage'));
const ReaditPostPage = lazy(() => import('./pages/ReaditPostPage'));
const ReaditSubmitPage = lazy(() => import('./pages/ReaditSubmitPage'));
const ReaditCreateCommunityPage = lazy(() => import('./pages/ReaditCreateCommunityPage'));
const ReaditCreatePostPage = lazy(() => import('./pages/ReaditCreatePostPage'));

export const UserContext = createContext({});

// OPTIMIZED LOADING COMPONENT
const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
);

const App = () => {
    const [userAuth, setUserAuth] = useState({ access_token: null });
    const [isAuthInitialized, setIsAuthInitialized] = useState(false);

    // Global keyboard shortcuts
    useKeyboardShortcuts();

    useEffect(() => {
        let userInSession = lookInSession("user");
        if (userInSession) {
            // lookInSession now handles parsing and sanitization
            const parsedUser = userInSession;

            // CRITICAL FIX: Set token BEFORE state update
            if (parsedUser.access_token) {
                setAuthToken(parsedUser.access_token);
            }

            setUserAuth(parsedUser);
        } else {
            setAuthToken(null);
            setUserAuth({ access_token: null });
        }
        setIsAuthInitialized(true);
    }, []);

    // OPTIMIZATION: Memoize UserContext value to prevent unnecessary re-renders
    const userContextValue = useMemo(() => ({
        userAuth,
        setUserAuth
    }), [userAuth]);

    // Show loading until auth is initialized
    if (!isAuthInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181b]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <HelmetProvider>
            <UserContext.Provider value={userContextValue}>
                <ThemeProvider>
                    <SocketProvider>
                        <div className="min-h-screen bg-white dark:bg-[#18181b] text-black dark:text-white transition-colors duration-300">
                            <SEO
                                title="Shumse | Modern Blogging Platform"
                                description="Join the community of writers and readers on Shumse."
                            />
                            <Suspense fallback={<LoadingFallback />}>
                                <RouteErrorBoundary>
                                    <Routes>
                                        {/* Routes WITH AppLayout (Navbar/BottomNav) */}
                                       
                                            <Route index element={<><Navbar/><HomePage /><Footer/></>} />
                                            <Route path="contact" element={<ContactPage />} />
                                            <Route path="search/:search_query" element={<SearchPage />} />
                                            <Route path="search/tag/:search_query" element={<SearchPage />} />
                                            <Route path="user/:id" element={<ProfilePage />} />
                                            <Route path="post/:blog_id" element={<BlogPage />} />

                                            {/* Story Routes */}
                                            <Route path="stories" element={<StoriesList />} />
                                            <Route path="stories/trending" element={<StoriesList />} />
                                            <Route path="story/:story_id" element={<StoryViewerModal />} />

                                            {/* --- OPTIMIZED READIT ROUTES --- */}
                                            <Route path="readit">
                                                <Route path="home" element={<ReaditHomePage />} />
                                                <Route path="c/:communityName" element={<ReaditCommunityPage />} />
                                                <Route path="create-community" element={<ReaditCreateCommunityPage />} />
                                                <Route path="create-post" element={<ReaditCreatePostPage />} />
                                                <Route path="post/:postId" element={<ReaditPostPage />} />
                                                <Route path="c/:communityName/submit" element={<ReaditSubmitPage />} />
                                                <Route index element={<ReaditHomePage />} />
                                            </Route>

                                            <Route path="*" element={<NotFound />} />
                                        

                                        {/* Dashboard Routes */}
                                        <Route path="/dashboard" element={<SideNav />}>
                                            <Route path="notifications" element={<Notifications />} />
                                            <Route path="blogs" element={<ManageBlog />} />
                                            <Route index element={<Notifications />} />
                                        </Route>

                                        <Route path="/settings" element={<SideNav />}>
                                            <Route path="edit-profile" element={<EditProfile />} />
                                            <Route path="update-password" element={<ChangePassword />} />
                                            <Route index element={<EditProfile />} />
                                        </Route>

                                        {/* Fullscreen Routes */}
                                        <Route path="/editor" element={<Editor />} />
                                        <Route path="/editor/:blog_id" element={<Editor />} />
                                        <Route path="/story-editor" element={<StoryEditor />} />
                                        <Route path="/signin" element={<UserAuthForm type="sign-in" />} />
                                        <Route path="/signup" element={<UserAuthForm type="sign-up" />} />
                                    </Routes>
                                </RouteErrorBoundary>
                            </Suspense>
                        </div>
                    </SocketProvider>
                </ThemeProvider>
            </UserContext.Provider>
        </HelmetProvider>
    );
};

export default App;