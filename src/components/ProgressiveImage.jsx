import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProgressiveImage = ({
    src,
    placeholder,
    alt,
    className = '',
    style = {},
    transitionDuration = 0.3,
    blurAmount = '8px'
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholder);

    useEffect(() => {
        const img = new Image();
        img.src = src;

        img.onload = () => {
            setCurrentSrc(src);
            setImageLoaded(true);
        };

        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            // Fallback to placeholder if image fails to load
            setCurrentSrc(placeholder || '/placeholder-image.jpg');
            setImageLoaded(true);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, placeholder]);

    return (
        <div className={`relative overflow-hidden ${className}`} style={style}>
            {/* Placeholder image (always shown) */}
            <img
                src={placeholder}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                style={{
                    filter: `blur(${blurAmount})`,
                    transform: 'scale(1.1)'
                }}
            />

            {/* Main image */}
            <motion.img
                src={currentSrc}
                alt={alt}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: transitionDuration }}
                loading="lazy"
            />

            {/* Loading indicator (optional) */}
            {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
};

export default ProgressiveImage;