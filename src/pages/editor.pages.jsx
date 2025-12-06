import React, { useContext, useState, createContext, useEffect } from "react";
import { UserContext } from "../App";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import BlogEditor from "../components/BlogEditor";
import PublishForm from "../components/PublishForm";
import StoryEditor from "./StoryEditor";
import Loader from "../components/Loader";
import api from "../common/api";
import { toast } from "react-hot-toast";

const BlogStructure = {
  title: "",
  content: [{ blocks: [] }], // Array format expected by backend
  banner: "",
  tags: [],
  category: "",
  readTime: "",
  des: "",
  author: { personal_info: {} },
};

const StoryStructure = {
  title: "",
  images: [],
  banner: "",
  tags: [],
  category: "",
  readTime: "",
  author: { personal_info: {} },
};

export const EditorContext = createContext({});
export const StoryContext = createContext({});

const Editor = () => {
  const { blog_id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(BlogStructure);
  const [story, setStory] = useState(StoryStructure);
  const [editorState, setEditorState] = useState("editor");
  const [textState, setTextState] = useState({ blocks: [], time: Date.now(), version: "2.28.2" });
  const [contentType, setContentType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userAuth: { access_token } } = useContext(UserContext);

  useEffect(() => {
    if (!blog_id) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const { data } = await api.post(
          "/get-post",
          { blog_id, draft: true, mode: "edit" }
        );

        setBlog(data.blog);
        // Auto-detect content type based on response
        if (data.blog.content) {
          setContentType("blog");
          // Initialize textState with existing content
          // Backend stores content as array, so get first element
          if (Array.isArray(data.blog.content) && data.blog.content[0]?.blocks) {
            setTextState(data.blog.content[0]);
          } else if (data.blog.content?.blocks) {
            setTextState(data.blog.content);
          }
        } else if (data.blog.images) {
          setContentType("story");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.response?.data?.error || "Failed to load post");
        toast.error(err.response?.data?.error || "Failed to load post");
        if (err.response?.status === 404) {
          navigate("/not-found");
        }
      } finally {
        setLoading(false);
      }
    };

    if (access_token) {
      fetchPost();
    }
  }, [blog_id, access_token, navigate]);

  if (!access_token) {
    return <Navigate to="/signup" />;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
          <div className="mb-4">
            <i className="fi fi-rr-exclamation text-5xl text-red-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!contentType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-lg w-full">
          <div className="mb-6">
            <i className="fi fi-rr-edit text-6xl text-indigo-600"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            What do you want to create?
          </h1>
          <p className="text-gray-600 mb-8">
            Choose the type of content you'd like to publish
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setContentType("blog")}
              className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
            >
              <i className="fi fi-rr-document mr-2"></i>
              Create Blog
              <span className="block text-xs mt-1 opacity-90">Rich text editor</span>
            </button>
            <button
              onClick={() => setContentType("story")}
              className="group relative bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
            >
              <i className="fi fi-rr-picture mr-2"></i>
              Create Story
              <span className="block text-xs mt-1 opacity-90">Image carousel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textState, setTextState, contentType }}>
      <StoryContext.Provider value={{ story, setStory }}>
        {editorState === "editor" ? (
          contentType === "blog" ? <BlogEditor /> : <StoryEditor />
        ) : (
          <PublishForm />
        )}
      </StoryContext.Provider>
    </EditorContext.Provider>
  );
};

export default Editor;