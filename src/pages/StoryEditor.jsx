import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast, { Toaster } from 'react-hot-toast';
import { FiPlus, FiImage, FiX, FiRotateCw } from 'react-icons/fi';
// Import ReactQuill if you use it. It's commented out in your original file.
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { userContext } from '../App';
import { UploadImage } from '../common/aws';
import Tags from '../components/tags.component';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function StoryEditor() {
  const [story, setStory] = useState({
    title: '',
    banner: null,
    slides: [],
    tags: [],
  });
  const [loading, setLoading] = useState({ publishing: false });
  const navigate = useNavigate();
  const { userAuth: { access_token } } = useContext(userContext);

  // Banner dropzone with file type/size validation
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/jpg': []
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;
      
      // Extra validation
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type. Please upload an image.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum file size is 5MB.");
        return;
      }

      try {
        // --- MODIFIED ---
        // UploadImage now returns an object { url, public_id }.
        // We destructure 'url' from it.
        const { url } = await UploadImage(file);
        
        setStory(prev => ({ ...prev, banner: url }));
        toast.success('Banner uploaded successfully!');
      } catch (error) {
        toast.error('Banner upload failed');
        console.error("Upload error:", error);
      }
    }
  });

  // Upload multiple slides at once with file type/size validation
  const handleMultipleSlidesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Filter out any non-image or large files
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Append new slides with a temporary "loading" state
    setStory(prev => ({
      ...prev,
      slides: [
        ...prev.slides,
        ...validFiles.map(file => ({
          url: '',
          description: '',
          file, // Keep track of the original file object for matching
          loading: true,
          error: null
        }))
      ]
    }));

    await Promise.all(
      validFiles.map(async (file) => {
        try {
            // --- MODIFIED ---
            // Destructure 'url' from the response object
            const { url } = await UploadImage(file);

            setStory(prev => {
                const updatedSlides = [...prev.slides];
                // Find the slide that matches this file object to update the correct one
                const targetIndex = updatedSlides.findIndex(s => s.file === file);
                
                if (targetIndex !== -1) {
                    updatedSlides[targetIndex] = {
                        ...updatedSlides[targetIndex],
                        url: url, // Use the extracted URL
                        loading: false,
                        file: null, // Clear file object to free memory
                    };
                }
                return { ...prev, slides: updatedSlides };
            });
            toast.success(`Image uploaded!`);

        } catch (error) {
            setStory(prev => {
                const updatedSlides = [...prev.slides];
                const targetIndex = updatedSlides.findIndex(s => s.file === file);
                
                if (targetIndex !== -1) {
                    updatedSlides[targetIndex] = {
                        ...updatedSlides[targetIndex],
                        loading: false,
                        error: 'Upload failed. Click to retry.'
                    };
                }
                return { ...prev, slides: updatedSlides };
            });
            toast.error(`An image upload failed`);
        }
      })
    );
    e.target.value = null;
  };

  // Single slide upload (for reuploading) with file type/size check
  const handleSlideUpload = async (file, index) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum file size is 5MB.");
      return;
    }
    
    const updatedSlides = [...story.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      loading: true,
      error: null
    };
    setStory(prev => ({ ...prev, slides: updatedSlides }));

    try {
      // --- MODIFIED ---
      // Destructure 'url' from the response object
      const { url } = await UploadImage(file);
      
      setStory(prev => {
          const newSlides = [...prev.slides];
          newSlides[index] = {
            ...newSlides[index],
            url: url, // Use the extracted URL
            loading: false,
            file: null
          };
          return { ...prev, slides: newSlides };
      });
      toast.success(`Slide ${index + 1} uploaded!`);
    } catch (error) {
      setStory(prev => {
          const newSlides = [...prev.slides];
          newSlides[index] = {
            ...newSlides[index],
            loading: false,
            error: 'Upload failed. Click to retry.'
          };
          return { ...prev, slides: newSlides };
      });
      toast.error(`Slide ${index + 1} upload failed`);
    }
  };

  // --- NO CHANGES below this line ---

  const removeSlide = (index) => {
    setStory(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(story.slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStory(prev => ({ ...prev, slides: items }));
  };

  const handleSubmit = async () => {
    setLoading({ publishing: true });
    try {
      if (!story.title || !story.banner || story.slides.length === 0) {
        throw new Error('Please fill all required fields before publishing');
      }

      const storyData = {
        title: story.title,
        banner: story.banner,
        tags: story.tags,
        draft: false,
        images: story.slides.map(slide => ({
          url: slide.url,
          description: slide.description
        }))
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/create-story`,
        storyData,
        {
          headers: { Authorization: `Bearer ${access_token}` }
        }
      );

      toast.success('Story published!');
      navigate(`/story/${data.story_id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading({ publishing: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 rounded-2xl shadow-xl">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          {story.title ? story.title : "New Story"}
        </h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading.publishing}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 disabled:opacity-50 transition"
        >
          {loading.publishing ? <FiRotateCw className="animate-spin" /> : 'Publish'}
        </button>
      </div>

      <form className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Title *
          </label>
          <input
            type="text"
            value={story.title}
            onChange={(e) => setStory(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Enter story title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Banner *
          </label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors min-h-[300px] flex items-center justify-center bg-white"
          >
            <input {...getInputProps()} />
            {story.banner ? (
              <img
                src={story.banner}
                alt="Banner preview"
                className="max-h-80 mx-auto rounded-2xl object-cover"
              />
            ) : (
              <div className="text-gray-500">
                <FiImage className="text-5xl mx-auto mb-4" />
                <p>Drag & drop banner image or click to select</p>
                <p className="text-sm text-gray-400 mt-2">High resolution images work best</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Slides {story.slides.length > 0 && `(${story.slides.length})`}
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-2xl cursor-pointer hover:bg-blue-700 transition">
                <FiPlus /> Upload Multiple Slides
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleSlidesUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="slides">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {story.slides.map((slide, index) => (
                    <Draggable
                      key={index} // Note: Using index as key is not ideal if list is re-ordered heavily, but fine for this
                      draggableId={`slide-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow-lg transition"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center gap-2 cursor-move text-gray-600"
                            >
                              <span className="font-medium">Slide {index + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSlide(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <FiX size={20} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 border-dashed rounded-2xl p-4 relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleSlideUpload(e.target.files[0], index)
                                }
                                className="hidden"
                                id={`slide-upload-${index}`}
                              />
                              <label
                                htmlFor={`slide-upload-${index}`}
                                className="cursor-pointer block text-center h-full"
                              >
                                {slide.url ? (
                                  <img
                                    src={slide.url}
                                    alt={`Slide ${index + 1}`}
                                    className="max-h-60 mx-auto rounded-2xl object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="text-gray-500 py-8">
                                    {slide.loading ? (
                                      <div className="flex flex-col items-center">
                                        <FiRotateCw className="animate-spin text-4xl mb-2" />
                                        <p>Uploading...</p>
                                      </div>
                                    ) : (
                                      <>
                                        <FiImage className="text-4xl mx-auto mb-2" />
                                        <p>{slide.error || 'Click to upload image'}</p>
                                      </>
                                    )}
                                  </div>
                                )}
                              </label>
                            </div>

                            <div className="h-full">
                              {/* Your ReactQuill component. Make sure it's imported if you use it. */}
                              <textarea
                                value={slide.description}
                                onChange={(e) => {
                                  const newSlides = [...story.slides];
                                  newSlides[index].description = e.target.value;
                                  setStory(prev => ({ ...prev, slides: newSlides }));
                                }}
                                placeholder="Slide description..."
                                className="w-full h-full p-2 border rounded-2xl"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (max 5)
          </label>
          <Tags
            tags={story.tags}
            setTags={(newTags) => setStory(prev => ({ ...prev, tags: newTags }))}
          />
        </div>
      </form>
    </div>
  );
}