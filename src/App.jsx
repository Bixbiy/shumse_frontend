import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import StoryEditor from "./pages/StoryEditor";
import StoriesList from "./components/StoriesList";      // New component: list of stories
// New component: story detail view
import SearchPage from "./pages/search.page";
import NotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import { HelmetProvider } from "react-helmet-async"; // Import HelmetProvider
import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notificactions from "./pages/notifications.page";
import ManageBlog from "./pages/manage-blogs.page";
import StoryViewerModal from "./components/StoryViewer";
import { ThemeProvider } from "./context/ThemeContext";
import ContactPage from "./pages/Contact.page";
import Footer from "./components/Footer";
export const userContext = createContext({});

const App = () => {
  const [userAuth, setUserAuth] = useState({ access_token: null });

  useEffect(() => {
    let userInSession = lookInSession("user");
    if (userInSession) {
      try {
        const parsedUser =
          typeof userInSession === "string" ? JSON.parse(userInSession) : userInSession;
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
          <div className="bg-white text-black dark:bg-[#18181b] dark:text-white min-h-screen">

            <Routes>
              <Route path="/editor" element={<><Navbar /><Editor /> <Footer /></>} />
              <Route path="/contact" element={<><Navbar /><ContactPage /> <Footer /></>} />
              <Route path="/editor/:blog_id" element={<><Navbar /><Editor /> <Footer /></>} />
              <Route path="/" element={<><Navbar /><HomePage /> <Footer /></>} />
              <Route path="/signin" element={<><UserAuthForm type="sign-in" /> <Footer /></>} />
              <Route path="/signup" element={<><UserAuthForm type="sign-up" /> <Footer /></>} />
              <Route path="/dashboard" element={<><SideNav /> <Footer /></>}>
                <Route path="notifications" element={<><Notificactions /> <Footer /></>} />
                <Route path="blogs" element={<ManageBlog />} />
              </Route>
              <Route path="/settings" element={<SideNav />}>
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="update-password" element={<ChangePassword />} />
              </Route>
              {/* Route for search */}
              <Route path="/search/:search_query" element={<><Navbar /><SearchPage /> <Footer /></>} />
              {/* Route for search tag */}
              <Route path="/search/tag/:search_query" element={<><Navbar /><SearchPage /> <Footer /></>} />

              {/* Story Routes */}
              <Route path="/story-editor" element={<><Navbar /><StoryEditor /></>} />
              <Route path="/stories" element={<><StoriesList /> <Footer /></>} />
              <Route path="/stories/trending" element={<><StoriesList /> <Footer /></>} />
              <Route path="/story/:story_id" element={<><Navbar /><StoryViewerModal /></>} />
              <Route path="/user/:id" element={<><Navbar /><ProfilePage /> <Footer /></>} />
              <Route path="post/:blog_id" element={<><Navbar /><BlogPage /> <Footer /></>} />
              <Route path="/*" element={<><Navbar /><NotFound /> <Footer /></>} />
            </Routes>
          </div>
        </ThemeProvider>
      </userContext.Provider>
    </HelmetProvider>
  );
};

export default App;
