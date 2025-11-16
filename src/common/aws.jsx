import axios from "axios";
import imageCompression from "browser-image-compression";

/**
 * Uploads an image by compressing it on the client and sending it as FormData
 * to the backend /upload endpoint.
 *
 * @param {File} img The image file object from an input or dropzone.
 * @returns {Promise<{url: string, public_id: string}>} The Cloudinary URL and public ID.
 */
export const UploadImage = async (img) => {
    try {
        if (!img) throw new Error("No image file provided.");

        // 1. Validate file type (Client-side check)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!allowedTypes.includes(img.type)) {
            throw new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
        }

        // 2. Client-side compression
        // This is still a good idea! It saves the user's upload bandwidth
        // and makes the request much faster. The backend will then do the
        // final optimization (like converting to WebP).
        const options = {
            maxSizeMB: 1, // Allow a slightly larger size, backend will handle final compression
            maxWidthOrHeight: 1920, // Match backend max width
            useWebWorker: true,
        };
        
        const compressedImage = await imageCompression(img, options);
        
        // 3. Create FormData (This is the new part)
        // We no longer convert to Base64. We send the file object directly.
        const formData = new FormData();
        
        // The key "image" MUST match your backend's `upload.single("image")`
        // We pass the compressed file and its original name
        formData.append("image", compressedImage, img.name);

        // 4. Upload to your Backend
        // Axios will automatically set the 'Content-Type' to 'multipart/form-data'
        // when it detects you are sending FormData.
        const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/upload`, 
            formData
        );

        // 5. Backend returns: { url: "...", public_id: "..." }
        // The 'url' is now the public res.cloudinary.com URL.
        return data; 

    } catch (error) {
        console.error("Image Upload Error:", error.message);
        
        // Try to show a more specific error from the server if available
        if (error.response && error.response.data && error.response.data.error) {
           throw new Error(error.response.data.error);
        }
        
        // Throw the original error
        throw error; 
    }
};