import React, { useRef, useState, useContext, useEffect } from "react";
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
  const { userAuth: { access_token } } = useContext(UserContext);
  const navigate = useNavigate();


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

  const handleBannerUpload = (e) => {
    const img = e.target.files[0];
    if (img) {
      const loadingToast = toast.loading("Uploading...");
      UploadImage(img)
        .then(({ url }) => {
          if (url) {
            toast.dismiss(loadingToast);
            toast.success("Uploaded 👍");
            setPreviewBanner(url);
            setBlog((prev) => ({ ...prev, banner: url }));
          }
        })
        .catch((err) => {
          toast.dismiss(loadingToast);
          return toast.error(err);
        });
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
    if (!banner.length) {
      return toast.error("Upload a blog banner to publish it");
    }
    if (!title.length) {
      return toast.error("Write blog title to publish it");
    }
    if (textState.blocks.length === 0 && !des.length) {
      return toast.error("Write something in your blog to publish it");
    }

    setEditorState("publish");
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error("Write blog title before saving it as a draft");
    }

    const loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");

    if (textState.blocks.length) {
      // Ensure content is an array for consistency with backend expectation if needed
      // But usually content is just the object. Let's check how it's used.
      // The original code set content: data.
      // Let's assume content is the object.

      const blogObj = {
        title,
        banner,
        des,
        content: textState, // Pass the object directly
        tags,
        draft: true,
      };

      api.post(
        "/create-blog",
        { ...blogObj, id: blog_id }
      )
        .then(() => {
          e.target.classList.remove("disable");
          toast.dismiss(loadingToast);
          toast.success("Saved 👍");

          setTimeout(() => {
            navigate("/dashboard/blogs?tab=draft");
          }, 500);
        })
        .catch(({ response }) => {
          e.target.classList.remove("disable");
          toast.dismiss(loadingToast);
          return toast.error(response.data.error);
        });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="logo" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
              <label htmlFor="uploadBanner">
                <img
                  src={previewBanner}
                  alt="Banner"
                  className="z-20"
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="text-editor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;