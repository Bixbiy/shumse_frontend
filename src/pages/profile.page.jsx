import {
  useEffect,
  useState,
  useMemo,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../common/seo";
import api from "../common/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaGithub,
  FaGlobe,
  FaCamera,
  FaEdit,
  FaMapMarkerAlt,

  FaCalendarAlt,
} from "react-icons/fa";
import { UserContext } from "../App";
import { useSocket } from "../context/SocketContext";
import PostFlair from "../components/readit/PostFlair";
import CommunityCard from "../components/readit/CommunityCard";
import VerificationBadge from "../components/VerificationBadge";

// Shimmer Loader Component
const ShimmerLoader = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-64 bg-gray-200 rounded-xl w-full" />
    <div className="flex flex-col md:flex-row gap-8 px-4 -mt-12 relative z-10">
      <div className="w-32 h-32 rounded-full bg-gray-300 border-4 border-white mx-auto md:mx-0" />
      <div className="flex-1 space-y-3 mt-4 text-center md:text-left">
        <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto md:mx-0" />
        <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto md:mx-0" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

const socialConfigs = [
  { key: "facebook", Icon: FaFacebookF, color: "hover:text-blue-600" },
  { key: "twitter", Icon: FaTwitter, color: "hover:text-blue-400" },
  { key: "instagram", Icon: FaInstagram, color: "hover:text-pink-500" },
  { key: "linkedin", Icon: FaLinkedinIn, color: "hover:text-blue-700" },
  { key: "github", Icon: FaGithub, color: "hover:text-gray-900" },
  { key: "website", Icon: FaGlobe, color: "hover:text-green-600" },
];

const ProfilePage = () => {
  const { id: profileId } = useParams();
  const { userAuth } = useContext(UserContext);
  const currentUserId = useMemo(() => userAuth?.id, [userAuth]);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  // Pagination state
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(1);

  // Community Mock Data (To be replaced with real backend data later)
  const [communities, setCommunities] = useState([]);

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
    api
      .post("/get-profile", {
        username: profileId,
      })
      .then(({ data }) => {
        if (data && (data._id || data.id)) {
          setProfile(data);
          setPosts(data.blogs || []);
          setStories(data.stories || []);
          setHasMorePosts((data.blogs || []).length >= 8);
          setCommunities(data.communities || []);
        } else {
          setProfile({ notFound: true });
        }
      })
      .catch(() => setProfile({ notFound: true }))
      .finally(() => setLoadingProfile(false));
  }, [profileId]);

  // Fetch additional posts
  useEffect(() => {
    if (page === 1) return;
    api
      .get("/get-profile-posts", { params: { user: profileId, page, limit: 8 } })
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

  // ─── Real-time Profile Updates ──────────────────────────────────────────────
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("profileUpdated", (updatedUser) => {
      if (profile && (profile._id === updatedUser._id || profile.id === updatedUser._id)) {
        setProfile((prev) => ({
          ...prev,
          personal_info: {
            ...prev.personal_info,
            fullname: updatedUser.personal_info.fullname,
            username: updatedUser.personal_info.username,
            profile_img: updatedUser.personal_info.profile_img,
            bio: updatedUser.personal_info.bio,
          },
          social_links: updatedUser.social_links,
        }));
      }

      setPosts((prevPosts) => {
        if (!prevPosts || prevPosts.length === 0) return prevPosts;
        return prevPosts.map((post) => {
          const postAuthorId = post.authorId?._id || post.authorId;
          if (updatedUser._id === postAuthorId) {
            return {
              ...post,
              authorId: {
                ...(typeof post.authorId === "object" ? post.authorId : {}),
                personal_info: updatedUser.personal_info,
              },
            };
          }
          return post;
        });
      });
    });

    return () => {
      socket.off("profileUpdated");
    };
  }, [socket, profile]);

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <ShimmerLoader />
      </div>
    );
  }

  if (profile.notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">User Not Found</h2>
        <p className="text-gray-500 text-lg">
          The user you are looking for does not exist.
        </p>
        <Link to="/" className="mt-6 btn-dark px-6 py-2 rounded-full">
          Go Home
        </Link>
      </div>
    );
  }

  const {
    personal_info: { fullname, username, profile_img, bio, isVerified },
    account_info: { totalPosts, total_reads },
    social_links,
    joinedAt,
  } = profile;

  const isOwner = String(currentUserId) === String(profile._id || profile.id);

  return (
    <>
      <SEO
        title={`${fullname} (@${username}) • Profile`}
        description={bio || `${fullname}'s profile on OurPlatform`}
        image={profile_img || "/default-avatar.png"}
        type="profile"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50 pb-20"
      >
        {/* ─── Hero / Banner Section ──────────────────────────────── */}
        <div className="relative h-64 md:h-80 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
          {/* Abstract Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-pink-400 blur-3xl mix-blend-overlay"></div>
          </div>
        </div>

        {/* ─── Profile Info Content ────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 md:-mt-24 z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">

              {/* Profile Image */}
              <div className="relative -mt-20 md:-mt-28 flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-white shadow-lg">
                  <img
                    src={profile_img || "/default-avatar.png"}
                    alt={fullname}
                    className="w-full h-full rounded-full object-cover border-2 border-gray-100"
                  />
                </div>
                {isOwner && (
                  <Link
                    to="/settings/edit-profile"
                    className="absolute bottom-2 right-2 p-2 bg-gray-900 text-white rounded-full hover:bg-black transition shadow-md"
                    title="Edit Profile Picture"
                  >
                    <FaCamera size={14} />
                  </Link>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 capitalize flex items-center justify-center md:justify-start gap-2">
                      {fullname}
                      {isVerified && <VerificationBadge className="ml-2" size={24} />}
                      {/* Placeholder specific Flair based on user role or mock */}
                      {username === 'admin' && <PostFlair flair={{ text: 'Admin', backgroundColor: '#ef4444', color: '#fff' }} size="sm" />}
                    </h1>
                    <p className="text-gray-500 font-medium">@{username}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    {isOwner ? (
                      <Link
                        to="/settings/edit-profile"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-900 font-medium rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <FaEdit /> <span>Edit Profile</span>
                      </Link>
                    ) : (
                      <button className="px-8 py-2.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                        Follow
                      </button>
                    )}
                  </div>
                </div>

                {/* Bio & Meta */}
                <div className="mt-4 max-w-2xl">
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {bio || "No bio available. Write something to tell the world about yourself!"}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span>Joined {new Date(joinedAt).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {/* Mock Map Location if not available */}
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>Earth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links & Stats Divider */}
            <hr className="my-6 border-gray-100" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Socials */}
              <div className="flex gap-4">
                {socialConfigs.map(({ key, Icon, color }) =>
                  social_links[key] ? (
                    <a
                      key={key}
                      href={social_links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-gray-400 transition-colors ${color}`}
                    >
                      <Icon size={20} />
                    </a>
                  ) : null
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 text-center">
                <div>
                  <span className="block text-xl font-bold text-gray-900">{totalPosts}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Posts</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-gray-900">{total_reads}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Reads</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-gray-900">{communities.length}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Joined</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs & Content ────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
          <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
            {["posts", "stories", "communities"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors relative ${activeTab === tab
                  ? "text-black"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-black"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {posts.length > 0 ? (
                  posts.map((post, idx) => {
                    const isLast = posts.length === idx + 1;
                    return (
                      <Link
                        to={`/post/${post.blog_id}`}
                        key={post.blog_id}
                        ref={isLast ? lastItemRef : null}
                        className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
                          <img
                            src={post.banner || "/post-placeholder.jpg"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Tag/Category Overlay */}
                          {post.tags && post.tags[0] && (
                            <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                              {post.tags[0]}
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                            {post.des || "No description available."}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                              <span>Read more</span>
                              <i className="flaticon-right-arrow text-xs" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-6xl mb-4">✍️</div>
                    <h3 className="text-xl font-bold text-gray-900">No posts yet</h3>
                    <p className="text-gray-500 mt-2">This user hasn&rsquo;t published any blogs.</p>
                  </div>
                )}
                {hasMorePosts && (
                  <div className="col-span-full pt-8">
                    <ShimmerLoader />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "stories" && (
              <motion.div
                key="stories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {stories.length > 0 ? (
                  stories.map(story => (
                    <div
                      key={story.story_id}
                      className="aspect-[9/16] relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all"
                      onClick={() => window.alert("Story viewer implementation pending")}
                    >
                      <img
                        src={story.banner || "/story-placeholder.jpg"}
                        alt={story.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                        <h4 className="text-white font-medium text-sm line-clamp-2">{story.title}</h4>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <h3 className="text-xl font-bold text-gray-900">No stories yet</h3>
                    <p className="text-gray-500 mt-2">This user hasn&rsquo;t posted any stories.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "communities" && (
              <motion.div
                key="communities"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {communities.length > 0 ? (
                  communities.map((community, i) => (
                    <CommunityCard key={community._id || i} community={community} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-gray-900">No communities</h3>
                    <p className="text-gray-500 mt-2">This user hasn&rsquo;t joined any communities yet.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </>
  );
};

export default ProfilePage;
