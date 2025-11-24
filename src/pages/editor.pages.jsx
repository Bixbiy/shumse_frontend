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
  content: [],
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
  const [textState, setTextState] = useState({ isReady: false });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!contentType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-6">What do you want to create?</h1>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setContentType("blog")}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
            >
              Create Blog
            </button>
            <button
              onClick={() => setContentType("story")}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-all"
            >
              Create Story
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