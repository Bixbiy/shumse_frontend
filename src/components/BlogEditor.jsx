import React, { useRef, useState, useContext, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import logo from "../imgs/logo.png";

import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { UploadImage } from "../common/aws";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import api from "../common/api";

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
import { UserContext } from '../App';

// Upload image for EditorJS
const uploadImageFile = async (file) => {
  try {
    const response = await UploadImage(file);
    const url = typeof response === 'string' ? response : response.url;

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
  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
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
  const { blog_id } = useParams();
  const {
    blog,
    blog: { title, banner, des, content, isPublished, tags = [] },
    setBlog,
    textState,
    setTextState,
    editorState,
    setEditorState,
  } = useContext(EditorContext);

  const fileInputRef = useRef(null);
  const [previewBanner, setPreviewBanner] = useState(blog.banner || defaultBanner);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef(null);
  const { userAuth: { access_token } } = useContext(UserContext);
  const navigate = useNavigate();
  const autoSaveTimerRef = useRef(null);

  // When a blog_id exists, update blog context to include it
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
              uploadByFile: uploadImageFile,
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
      data: Array.isArray(content) ? content[0] : content,
      onChange: async () => {
        let data = await editorInstance.save();
        setBlog((prev) => ({ ...prev, content: data }));
        setTextState(data);
      },
    });

    editorRef.current = editorInstance;
  };

  useEffect(() => {
    if (!editorRef.current) {
      initializeEditor();
    }
    return () => {
      // Cleanup if necessary
    };
  }, []);

  const handleBannerUpload = async (e) => {
    const img = e.target.files[0];
    if (!img) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(img.type)) {
      return toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
    }

    // Validate file size (max 10MB)
    if (img.size > 10 * 1024 * 1024) {
      return toast.error('Image size should be less than 10MB');
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const toastId = toast.loading(`Uploading banner... ${Math.min(prev + 10, 90)}%`);
        if (prev >= 90) {
          clearInterval(progressInterval);
          toast.dismiss(toastId);
          return 90;
        }
        toast.dismiss(toastId);
        return prev + 10;
      });
    }, 200);

    try {
      // aws.jsx returns either string or {url: string}
      const response = await UploadImage(img);
      const url = typeof response === 'string' ? response : response.url;

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (url) {
        toast.success('Banner uploaded successfully! 👍');
        setPreviewBanner(url);
        setBlog((prev) => ({ ...prev, banner: url }));
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Banner upload error:', err);
      toast.error(err.message || 'Failed to upload banner. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    const input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    setBlog((prev) => ({ ...prev, title: input.value }));
  };

  const handleError = (e) => {
    const img = e.target;
    img.src = defaultBanner;
  };

  const handlePublishEvent = () => {
    if (!banner || !banner.length) {
      return toast.error("Upload a blog banner to publish it");
    }
    if (!title || !title.length) {
      return toast.error("Write blog title to publish it");
    }
    if (!textState?.blocks?.length && !des?.length) {
      return toast.error("Write something in your blog to publish it");
    }

    setEditorState("publish");
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title || !title.length) {
      return toast.error("Write blog title before saving it as a draft");
    }

    const loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");

    const blogObj = {
      title,
      banner: banner || '',
      des: des || '',
      content: textState?.blocks?.length ? [textState] : [{ blocks: [] }], // Wrap in array for backend
      tags: tags || [],
      draft: true,
    };

    api.post(
      "/create-post",
      { ...blogObj, id: blog_id }
    )
      .then(() => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        toast.success("Draft saved successfully! 👍");

        setTimeout(() => {
          navigate("/dashboard/blogs?tab=draft");
        }, 500);
      })
      .catch(({ response }) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        const errorMsg = response?.data?.error || 'Failed to save draft';
        return toast.error(errorMsg);
      });
  };

  // Autosave functionality
  const autoSave = useCallback(() => {
    if (!title?.length || !textState?.blocks?.length) return;

    const blogObj = {
      title,
      banner: banner || '',
      des: des || '',
      content: [textState], // Wrap in array for backend
      tags: tags || [],
      draft: true,
    };

    api.post("/create-post", { ...blogObj, id: blog_id })
      .then(() => {
        toast.success('Auto-saved ✓', { duration: 1000 });
      })
      .catch((err) => {
        console.error('Autosave failed:', err);
      });
  }, [title, banner, des, textState, tags, blog_id]);

  // Setup autosave timer
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Autosave every 30 seconds if there's content
    if (title?.length && textState?.blocks?.length) {
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, textState, autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S for save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveButton = document.querySelector('.save-draft-btn');
        if (saveButton && !saveButton.classList.contains('disable')) {
          saveButton.click();
        }
      }
      // Ctrl/Cmd + P for publish
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePublishEvent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [banner, title, textState, des]);

  return (
    <>
      {/* Desktop/Mobile Navbar */}
      <nav className="navbar sticky top-0 z-50 bg-white shadow-sm">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="logo" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title?.length ? title : "New Blog"}
        </p>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-4 ml-auto">
          <button
            className="btn-dark py-2 px-6"
            onClick={handlePublishEvent}
            title="Publish (Ctrl+P)"
          >
            Publish
          </button>
          <button
            className="btn-light py-2 px-6 save-draft-btn"
            onClick={handleSaveDraft}
            title="Save Draft (Ctrl+S)"
          >
            Save Draft
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden ml-auto text-2xl">
          <i className="fi fi-rr-menu-dots-vertical"></i>
        </button>
      </nav>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-grey p-4 flex gap-3 z-50 safe-area-bottom">
        <button
          className="flex-1 btn-dark py-3 text-sm font-medium"
          onClick={handlePublishEvent}
        >
          Publish
        </button>
        <button
          className="flex-1 btn-light py-3 text-sm font-medium save-draft-btn"
          onClick={handleSaveDraft}
        >
          Save Draft
        </button>
      </div>

      <Toaster position="top-center" />

      <AnimationWrapper>
        <section className="pb-24 md:pb-8">
          <div className="mx-auto max-w-[900px] w-full px-4 md:px-6">
            {/* Banner Upload Section */}
            <div className="relative aspect-video bg-white border-4 border-grey rounded-lg overflow-hidden group">
              <label
                htmlFor="uploadBanner"
                className={`cursor-pointer block w-full h-full relative ${isUploading ? 'pointer-events-none' : ''}`}
              >
                <img
                  src={previewBanner}
                  alt="Blog Banner"
                  className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-80"
                  onError={handleError}
                />

                {/* Upload Overlay */}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center p-4">
                      <i className="fi fi-rr-camera text-4xl md:text-5xl mb-2 block"></i>
                      <p className="text-sm md:text-base font-medium">Click to upload banner</p>
                      <p className="text-xs mt-1 opacity-80">Recommended: 1920x1080px (Max 10MB)</p>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-md">
                      <div className="mb-4 text-white text-center">
                        <div className="animate-pulse mb-3">
                          <i className="fi fi-rr-upload text-4xl md:text-5xl"></i>
                        </div>
                        <p className="text-lg md:text-xl font-semibold mb-1">
                          Uploading Banner
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-blue-400">
                          {uploadProgress}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-lg">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg, .webp"
                  hidden
                  onChange={handleBannerUpload}
                  disabled={isUploading}
                  ref={fileInputRef}
                />
              </label>
            </div>

            {/* Title Input */}
            <textarea
              value={title || ''}
              placeholder="Blog Title"
              className="text-2xl md:text-4xl font-medium w-full h-auto min-h-[60px] md:min-h-[80px] outline-none resize-none mt-6 md:mt-10 leading-tight placeholder:opacity-40 bg-white focus:placeholder:opacity-60 transition-all"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
              maxLength={200}
            ></textarea>

            {/* Character Counter */}
            <p className="text-xs md:text-sm text-dark-grey text-right -mt-2">
              {title?.length || 0}/200 characters
            </p>

            <hr className="w-full opacity-10 my-5" />

            {/* Editor Container */}
            <div id="text-editor" className="font-gelasio min-h-[400px] prose max-w-none"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;