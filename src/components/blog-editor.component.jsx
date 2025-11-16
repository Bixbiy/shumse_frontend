import React, { useRef, useState, useContext, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../imgs/logo.png";

import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { UploadImage } from "../common/aws";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import axios from "axios";

// Import Editor.js tools
import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";
import Quote from "@editorjs/quote";
import Warning from "@editorjs/warning";
import Marker from "@editorjs/marker";
import CodeTool from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import LinkTool from "@editorjs/link";
import Table from "@editorjs/table";
import Paragraph from "@editorjs/paragraph";
import Checklist from "@editorjs/checklist";
import SimpleImage from "@editorjs/simple-image";
import RawTool from "@editorjs/raw";
import { userContext } from '../App';

// --- MODIFIED ---
const uploadImageFile = async (file) => {
  try {
    // Destructure 'url' from the response object
    const { url } = await UploadImage(file);
    if (url) {
      return { success: 1, file: { url } };
    } else {
      throw new Error("Upload failed, no URL returned.");
    }
  } catch (error) {
    toast.error("Image upload failed. Try again!");
    return { success: 0 };
  }
};

const uploadImageUrl = async (url) => {
  return new Promise((resolve) => {
    resolve({
      success: 1,
      file: { url },
    });
  });
};

const handleYoutubeEmbed = (url) => {
  // Extract video ID from YouTube URL
  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;

  return `<div class="embed-responsive aspect-video">
    <iframe 
      width="100%" 
      height="100%" 
      src="https://www.youtube.com/embed/${videoId}"
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
  </div>`;
};

const BlogEditor = () => {
  const { blog_id } = useParams(); // if editing an existing blog, blog_id comes from the URL
  const {
    blog,
    blog: { title, banner, des, content, isPublished },
    setBlog,
    textState,
    setTextState,
    editorState,
    setEditorState,
  } = useContext(EditorContext);
  const fileInputRef = useRef(null);
  const [previewBanner, setPreviewBanner] = useState(blog.banner || defaultBanner);
  const editorRef = useRef(null);
  const { userAuth: { access_token } } = useContext(userContext);


  // When a blog_id exists, update blog context to include it.
  useEffect(() => {
    if (blog_id) {
      setBlog((prev) => ({ ...prev, blog_id }));
    }
  }, [blog_id, setBlog]);

  // Function to initialize Editor.js
  const initializeEditor = () => {
    const editorInstance = new EditorJS({
      holder: "text-editor",
      placeholder: "Write your post here...",
      autofocus: true,
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          config: {
            placeholder: "Enter a post header",
            levels: [2, 3, 4],
            defaultLevel: 3,
          },
        },
        list: { class: List, inlineToolbar: true },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: uploadImageFile, // Uses our modified function
              uploadByUrl: uploadImageUrl,
            },
          },
        },
        embed: {
          class: Embed,
          inlineToolbar: true,
          config: {
            services: {
              youtube: true,
              coub: true
            }
          }
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: "Enter a quote",
            captionPlaceholder: "Quote's author",
          },
        },
        warning: Warning,
        marker: Marker,
        code: CodeTool,
        delimiter: Delimiter,
        inlineCode: InlineCode,
        linkTool: LinkTool,
        table: { class: Table, inlineToolbar: true },
        paragraph: { class: Paragraph, inlineToolbar: true },
        checklist: { class: Checklist, inlineToolbar: true },
        simpleImage: SimpleImage,
        raw: RawTool,
        // Add custom YouTube block
        youtubeEmbed: {
          class: class YouTubeEmbed {
            static get toolbox() {
              return {
                title: 'YouTube',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" fill="#FF0000"/></svg>'
              };
            }

            constructor({ data, api }) {
              this.api = api;
              this.data = {
                url: data.url || ''
              };
            }

            render() {
              const container = document.createElement('div');
              const input = document.createElement('input');
              input.placeholder = 'Paste YouTube URL here...';
              input.value = this.data.url;
              input.classList.add('ce-paragraph', 'cdx-block');

              input.addEventListener('paste', (event) => {
                const url = event.clipboardData.getData('text');
                const embedHtml = handleYoutubeEmbed(url);
                if (embedHtml) {
                  container.innerHTML = embedHtml;
                  this.data.url = url;
                }
              });

              input.addEventListener('change', (event) => {
                const url = event.target.value;
                const embedHtml = handleYoutubeEmbed(url);
                if (embedHtml) {
                  container.innerHTML = embedHtml;
                  this.data.url = url;
                }
              });

              if (this.data.url) {
                const embedHtml = handleYoutubeEmbed(this.data.url);
                if (embedHtml) {
                  container.innerHTML = embedHtml;
                }
              } else {
                container.appendChild(input);
              }

              return container;
            }

            save(blockContent) {
              return {
                url: this.data.url
              };
            }
          }
        }
      },
      // Initialize with current content if available
      data: Array.isArray(content) ? content[0] : content,
      onReady: () => {
        console.log("Editor.js is ready!");
        editorRef.current = editorInstance;
        setTextState(editorInstance);
      },
      onChange: async () => {
        try {
          if (editorRef.current) {
            const savedData = await editorRef.current.save();
            setBlog((prev) => ({ ...prev, content: savedData }));
          }
        } catch (err) {
          console.error("Error saving editor content:", err);
        }
      },
    });
  };

  // Reinitialize the editor when editorState changes
  useEffect(() => {
    const editorContainer = document.getElementById("text-editor");
    if (!editorContainer) return;

    // Destroy any existing instance before initializing a new one
    if (editorRef.current && typeof editorRef.current.destroy === "function") {
      try {
        editorRef.current.destroy();
      } catch (err) {
        console.error("Error destroying previous editor instance:", err);
      }
      editorRef.current = null;
    }
    initializeEditor();
    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        try {
          editorRef.current.destroy();
        } catch (err) {
          console.error("Error destroying editor instance:", err);
        }
      }
      editorRef.current = null;
    };
  }, [editorState]);

  // Handler to upload a banner image
  const handleUploadBanner = async (e) => {
    const img = e.target.files[0];
    if (!img) return;
    
    // Optimistic preview
    const fileReader = new FileReader();
    fileReader.readAsDataURL(img);
    fileReader.onloadend = () => setPreviewBanner(fileReader.result);
    
    const toastId = toast.loading("Uploading image...");
    try {
      // --- MODIFIED ---
      // Destructure 'url' from the response object
      const { url } = await UploadImage(img);

      if (url) {
        setBlog((prev) => ({ ...prev, banner: url }));
        setPreviewBanner(url); // Set final URL from Cloudinary
        toast.update(toastId, {
          render: "Image uploaded successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Image Upload Failed:", error);
      setPreviewBanner(blog.banner || defaultBanner); // Revert to old banner on fail
      toast.update(toastId, {
        render: "Image upload failed. Try again!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // Handler for blog title change
  const handleTitleChange = (e) => {
    let input = e.target.value;
    if (input.length > 100) input = input.slice(0, 100);
    setBlog((prev) => ({ ...prev, title: input }));
  };

  // Trigger the hidden file input
  const triggerFileInput = () => fileInputRef.current?.click();

  // Handle Publish event
  const handlePublishEvent = async () => {
    if (!banner || !banner.length)
      return toast.error("Please upload a banner image first");
    if (!title || !title.length)
      return toast.error("Please enter the title");
    if (editorRef.current) {
      try {
        const data = await editorRef.current.save();
        if (data.blocks && data.blocks.length) {
          setBlog((prev) => ({ ...prev, content: data }));
          setEditorState("publish");
        } else {
          toast.error("Write something to publish it");
        }
      } catch (err) {
        console.error("Error saving blog content:", err);
      }
    } else {
      console.error("Editor instance is not ready.");
    }
  };


  // Handler to save a draft
  const handleSaveDraft = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5)
      return toast.error("Title must be at least 5 characters long.");
    if (trimmedTitle.length > 100)
      return toast.error("Title cannot exceed 100 characters.");
    
    if (!editorRef.current) {
      console.error("Editor instance is not ready.");
      return toast.error("Editor is not ready, please wait.");
    }

    const loadingToast = toast.loading("Saving draft...");
    try {
      const contentData = await editorRef.current.save();
      const draftBlog = {
        title: trimmedTitle,
        des,
        banner,
        content: contentData,
        tags: blog.tags || [],
        draft: true,
      };

      // If blog_id exists (editing an existing post), include it in the payload
      const payload = blog_id ? { ...draftBlog, id: blog_id } : { ...draftBlog };
      
      await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/create-post",
        payload,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      
      toast.dismiss(loadingToast);
      toast.success("Draft saved successfully!");
      setEditorState("editor");

    } catch (error) {
      console.error("Error saving draft:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || "Failed to save draft.");
    }
  };

  // --- NO CHANGES below this line ---

  return (
    <>
      <ToastContainer position="top-center" theme="colored" />
      {/* Navbar */}
      <nav className="navbar flex justify-between items-center p-4 bg-white shadow-md">
        <Link to="/" className="flex-none w-[150px]">
          <img src={logo} alt="Spread_logo" className="h-10" />
        </Link>
        <span className="text-black text-lg font-semibold max-md:hidden w-full text-center">
          {title.length ? title : "New Blog"}
        </span>
        <div className="flex gap-4">
          <button
            className="btn-dark py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            onClick={handlePublishEvent}
          >
            Publish
          </button>
          <button
            onClick={handleSaveDraft}
            className="btn-light py-2 px-4 border border-gray-400 rounded-lg hover:bg-gray-200 transition"
          >
            Save Draft
          </button>
        </div>
      </nav>
      {/* Page Content */}
      <AnimationWrapper>
        <section className="py-6 px-4">
          <div className="mx-auto max-w-[890px] w-full">
            {/* Banner Image Upload */}
            <div
              className="relative aspect-video border-4 border-gray-300 bg-gray-100 hover:opacity-80 transition cursor-pointer rounded-lg"
              onClick={triggerFileInput}
            >
              <img
                src={previewBanner}
                alt="Banner"
                className="w-full h-full object-cover rounded-lg"
                onError={() => setPreviewBanner(defaultBanner)}
              />
              <input
                type="file"
                accept=".png, .jpg, .jpeg, .webp"
                className="hidden"
                ref={fileInputRef}
                onChange={handleUploadBanner}
              />
            </div>
            {/* Blog Title Input */}
            <div className="relative">
              <textarea
                placeholder="Blog Title"
                className="w-full h-16 p-4 my-4 text-2xl font-semibold bg-gray-100 resize-none rounded-lg mt-10 leading-tight placeholder:opacity-40"
                onChange={handleTitleChange}
                value={title}
              />
              <span className="absolute bottom-4 right-4 text-gray-500 text-sm">
                {title.length}/100
              </span>
            </div>
            <hr className="w-full opacity-100 my-5" />
            {/* Render editor container only once */}
            {(!isPublished || editorState === "editor") && (
              <div
                id="text-editor"
                className="prose max-w-none font-gelasio text-gray-800"
              />
            )}
          </div>
        </section>
        {/* If editing a published post, display the editor at the bottom */}
        {isPublished && editorState === "publish" && (
          <section className="py-6 px-4 border-t border-gray-300 mt-10">
            <h2 className="text-xl font-semibold mb-4">Edit Published Post</h2>
            <div
              id="text-editor"
              className="prose max-w-none font-gelasio text-gray-800"
            />
          </section>
        )}
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;