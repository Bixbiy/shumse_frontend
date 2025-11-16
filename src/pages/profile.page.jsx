// src/pages/ProfilePage.jsx

import React, {
  useEffect,
  useState,
  useMemo,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaGithub,
  FaGlobe,
} from "react-icons/fa";
import { userContext } from "../App";

// Simple shimmer skeleton loader
const ShimmerLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto" />
    <div className="h-64 bg-gray-300 rounded-lg mx-auto" />
    <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto" />
  </div>
);

const socialConfigs = [
  { key: "facebook", Icon: FaFacebookF, color: "text-blue-600" },
  { key: "twitter", Icon: FaTwitter, color: "text-blue-400" },
  { key: "instagram", Icon: FaInstagram, color: "text-pink-500" },
  { key: "linkedin", Icon: FaLinkedinIn, color: "text-blue-700" },
  { key: "github", Icon: FaGithub, color: "text-gray-800" },
  { key: "website", Icon: FaGlobe, color: "text-green-600" },
];

const ProfilePage = () => {
  const { id: profileId } = useParams();
  const { userAuth } = useContext(userContext);
  const currentUserId = useMemo(() => userAuth?.id, [userAuth]);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  // Pagination state
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(1);

  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (loadingProfile) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          activeTab === "posts" &&
          hasMorePosts
        ) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingProfile, hasMorePosts, activeTab]
  );

  // Fetch profile once
  useEffect(() => {
    setLoadingProfile(true);
    axios
      .post(`${import.meta.env.VITE_SERVER_DOMAIN}/api/v1/get-profile`, {
        username: profileId,
      })
      .then(({ data }) => {
        if (data && (data._id || data.id)) {
          setProfile(data);
          // initialize
          setPosts(data.blogs || []);
          setStories(data.stories || []);
          setHasMorePosts((data.blogs || []).length >= 8);
        } else {
          setProfile({ notFound: true });
        }
      })
      .catch(() => setProfile({ notFound: true }))
      .finally(() => setLoadingProfile(false));
  }, [profileId]);

  // Fetch additional pages when page increments
  useEffect(() => {
    if (page === 1) return;
    axios
      .get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/get-profile-posts`, // your paginated endpoint
        { params: { user: profileId, page, limit: 8 } }
      )
      .then(({ data }) => {
        if (data.length > 0) {
          setPosts((prev) => [...prev, ...data]);
          if (data.length < 8) setHasMorePosts(false);
        } else {
          setHasMorePosts(false);
        }
      })
      .catch(() => setHasMorePosts(false));
  }, [page, profileId]);

  if (loadingProfile) {
    return (
      <div className="mt-20">
        <ShimmerLoader />
      </div>
    );
  }

  if (profile.notFound) {
    return (
      <p className="text-center text-xl text-gray-500 mt-20">
        User not found.
      </p>
    );
  }

  const {
    personal_info: { fullname, username, profile_img, bio },
    account_info: { totalPosts, total_reads },
    social_links,
    joinedAt,
  } = profile;

  return (
    <>
      {/* SEO Meta */}
      <Helmet>
        <title>
          {fullname} (@{username}) • Profile
        </title>
        <meta
          name="description"
          content={bio || `${fullname}'s profile on OurPlatform`}
        />
        <meta property="og:title" content={`${fullname} (@${username})`} />
        <meta
          property="og:description"
          content={bio || `${fullname}'s profile`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: fullname,
            url: window.location.href,
            description: bio,
          })}
        </script>
      </Helmet>

      <motion.div
        className="max-w-3xl mx-auto p-6 bg-white bg-opacity-60 backdrop-blur-md rounded-2xl shadow-xl mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={profile_img || "/default-avatar.png"}
            alt={fullname}
            loading="lazy"
            className="w-32 h-32 rounded-full border-4 border-gradient-to-r from-indigo-400 to-purple-400 object-cover"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900">
              {fullname}
            </h1>
            <p className="text-lg text-gray-600">@{username}</p>
            <p className="text-sm text-gray-500">
              Joined {new Date(joinedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-6 py-4 border-t border-b border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalPosts}</p>
            <p className="text-sm text-gray-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{total_reads}</p>
            <p className="text-sm text-gray-500">Reads</p>
          </div>
        </div>

        {/* Edit Profile */}
        {String(currentUserId) === String(profile._id || profile.id) && (
          <div className="flex justify-center my-4">
            <Link
              to="/settings/edit-profile"
              className="px-6 py-2 uppercase text-sm tracking-wide bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-full shadow hover:scale-105 transform transition"
            >
              Edit Profile
            </Link>
          </div>
        )}

        {/* Bio */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <hr className="border-black w-50 mt-4 mb-2 opacity-[20%] " />
          <p className="text-gray-700 text-center mt-2">{bio || "No bio  available."}</p>
          <hr className="border-black w-50 mt-4 mb-2 opacity-[20%] " />
        </motion.div>

        {/* Social Links */}
        <div className="flex justify-center space-x-4 mt-6">
          {socialConfigs.map(({ key, Icon, color }) =>
            social_links[key] ? (
              <a
                key={key}
                href={social_links[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className={`p-3 bg-white rounded-full shadow-lg transform hover:scale-110 transition ${color}`}
              >
                <Icon size={20} />
              </a>
            ) : null
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex justify-center space-x-8 border-b">
            {["posts", "stories"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 ${activeTab === tab
                  ? "border-b-4 border-gradient-to-r from-indigo-400 to-purple-400 font-semibold text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "posts" ? (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
              >
                {posts.map((post, idx) => {
                  const isLast = posts.length === idx + 1;
                  return (
                    <Link
                      to={`/post/${post.blog_id}`}
                      key={post.blog_id}
                      ref={isLast ? lastItemRef : null}
                      className="bg-white  rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition"
                    >
                      <div className="relative h-48 w-full">
                        <img
                          src={post.banner || "/post-placeholder.jpg"}
                          alt={post.title}
                          loading="lazy"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className=" line-clamp-1  mb-2">
                          {post.title}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.des || "No description available."}
                        </p>
                      </div>
                    </Link>
                  );
                })}
                {hasMorePosts && (
                  <div className="col-span-full flex justify-center mt-4">
                    <ShimmerLoader />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="stories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
              >
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <div
                      key={story.story_id}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition cursor-pointer"
                      onClick={() => window.alert("Story modal open logic")}
                    >
                      <div className="relative h-48 w-full">
                        <img
                          src={story.banner || "/story-placeholder.jpg"}
                          alt={story.title}
                          loading="lazy"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className=" font-bold text-gray-900">
                          {story.title}
                        </h4>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500">
                    No stories available.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default React.memo(ProfilePage);
