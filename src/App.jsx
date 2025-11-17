/*
 * MODIFIED FILE (Complete Replacement)
 * Path: src/App.jsx
 */
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { createContext, useEffect, useState, Suspense, lazy } from "react";
import { lookInSession } from "./common/session";

// CORE LAYOUT
import Layout from "./components/Layout.jsx"; // <-- Import your main layout
import Navbar from "./components/navbar.component"; // <-- Keep for standalone routes
import Footer from "./components/Footer.jsx"; // <-- Keep for standalone routes
import SideNav from "./components/sidenavbar.component";

// CONTEXT
import { ThemeProvider } from "./context/ThemeContext";
export const userContext = createContext({});

// PAGE IMPORTS (Eager)
import UserAuthForm from "./pages/userAuthForm.page";
import HomePage from "./pages/home.page";
import Editor from "./pages/editor.pages";
import NotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SearchPage from "./pages/search.page";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notificactions from "./pages/notifications.page";
import ManageBlog from "./pages/manage-blogs.page";
import ContactPage from "./pages/Contact.page";

// STORY IMPORTS (Keep as-is)
import StoryEditor from "./pages/StoryEditor";
import StoriesList from "./components/StoriesList";
import StoryViewerModal from "./components/StoryViewer";

// LAZY LOADED READIT PAGES
const ReaditHomePage = lazy(() => import('./pages/ReaditHomePage.jsx'));
const ReaditCommunityPage = lazy(() => import('./pages/ReaditCommunityPage.jsx'));
const ReaditPostPage = lazy(() => import('./pages/ReaditPostPage.jsx'));
const ReaditSubmitPage = lazy(() => import('./pages/ReaditSubmitPage.jsx'));
const ReaditCreateCommunityPage = lazy(() => import('./pages/ReaditCreateCommunityPage.jsx'));
const ReaditCreatePostPage = lazy(() => import('./pages/ReaditCreatePostPage.jsx'));

// Optimized loading component
const LoadingFallback = () => (
    <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
);

const App = () => {
    const [userAuth, setUserAuth] = useState({ access_token: null });

    useEffect(() => {
        let userInSession = lookInSession("user");
        if (userInSession) {
            try {
                const parsedUser = typeof userInSession === "string" ? JSON.parse(userInSession) : userInSession;
                setUserAuth(parsedUser);
            } catch (error) {
                console.error("Error parsing user session data:", error);
                setUserAuth({ access_token: null });
            }
        } else {
            setUserAuth({ access_token: null });
        }
    }, []);

    return (
        <HelmetProvider>
            <userContext.Provider value={{ userAuth, setUserAuth }}>
                <ThemeProvider>
                    <div className="bg-white text-black dark:bg-[#18181b] dark:text-white min-h-screen transition-colors duration-200">
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                {/* Routes WITH Navbar & Footer */}
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<HomePage />} />
                                    <Route path="contact" element={<ContactPage />} />
                                    <Route path="search/:search_query" element={<SearchPage />} />
                                    <Route path="search/tag/:search_query" element={<SearchPage />} />
                                    <Route path="user/:id" element={<ProfilePage />} />
                                    <Route path="post/:blog_id" element={<BlogPage />} />
                                    
                                    {/* Story Routes */}
                                    <Route path="stories" element={<StoriesList />} />
                                    <Route path="stories/trending" element={<StoriesList />} />
                                    <Route path="story/:story_id" element={<StoryViewerModal />} />
                                    
                                    {/* --- NEW READIT ROUTES (NESTED) --- */}
                                    {/* This is the new, correct structure */}
                                    <Route path="readit">
                                        <Route path="home" element={<ReaditHomePage />} />
                                        <Route path="c/:communityName" element={<ReaditCommunityPage />} />
                                        <Route path="create-community" element={<ReaditCreateCommunityPage />} />
                                        <Route path="create-post" element={<ReaditCreatePostPage />} />
                                        <Route path="post/:postId" element={<ReaditPostPage />} />
                                        <Route path="c/:communityName/submit" element={<ReaditSubmitPage />} />
                                        {/* Redirect /readit to /readit/home */}
                                        <Route index element={<ReaditHomePage />} />
                                    </Route>
                                    {/* --- END READIT ROUTES --- */}
                                    
                                    <Route path="*" element={<NotFound />} />
                                </Route>

                                {/* Routes with SideNav (Dashboard) */}
                                <Route path="/dashboard" element={<SideNav />}>
                                    <Route path="notifications" element={<Notificactions />} />
                                    <Route path="blogs" element={<ManageBlog />} />
                                    <Route index element={<Notificactions />} /> 
                                </Route>
                                
                                <Route path="/settings" element={<SideNav />}>
                                    <Route path="edit-profile" element={<EditProfile />} />
                                    <Route path="update-password" element={<ChangePassword />} />
                                    <Route index element={<EditProfile />} />
                                </Route>

                                {/* Fullscreen Routes (No Navbar/Footer by default) */}
                                <Route path="/editor" element={<Editor />} />
                                <Route path="/editor/:blog_id" element={<Editor />} />
                                <Route path="/story-editor" element={<StoryEditor />} />
                                <Route path="/signin" element={<UserAuthForm type="sign-in" />} />
                                <Route path="/signup" element={<UserAuthForm type="sign-up" />} />
                                
                            </Routes>
                        </Suspense>
                    </div>
                </ThemeProvider>
            </userContext.Provider>
        </HelmetProvider>
    );
};

export default App;