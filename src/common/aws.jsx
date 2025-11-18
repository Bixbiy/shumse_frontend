// src/common/UploadImage.js - UPDATED VERSION
import imageCompression from "browser-image-compression";
import api from './api'; // Import your working api instance

/**
 * Uploads an image by compressing it on the client and sending it as FormData
 * to the backend /upload endpoint using your authenticated api instance.
 *
 * @param {File} img The image file object from an input or dropzone.
 * @returns {Promise<string>} The Cloudinary URL
 */
export const UploadImage = async (img) => {
    try {
       
        
        if (!img) throw new Error("No image file provided.");

        // 1. Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!allowedTypes.includes(img.type)) {
            throw new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
        }

       

        // 2. Client-side compression
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        
        const compressedImage = await imageCompression(img, options);
       

        // 3. Create FormData
        const formData = new FormData();
        formData.append("image", compressedImage, img.name);

        // 4. Upload using your API instance (this includes /api/v1 automatically)
      
        const { data } = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        });

      
        
        // Return just the URL for compatibility with your component
        return data.url; 

    } catch (error) {
        console.error("❌ Image Upload Error:", error);
        
        // Enhanced error handling
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            
            if (error.response.status === 404) {
                throw new Error('Upload endpoint not found. Please check server configuration.');
            } else if (error.response.status === 413) {
                throw new Error('File too large. Please choose a smaller image.');
            } else {
                throw new Error(error.response.data?.error || `Upload failed: ${error.response.status}`);
            }
        } else if (error.request) {
            throw new Error('No response from server. Check your connection.');
        } else {
            throw new Error(error.message || 'Upload failed');
        }
    }
};