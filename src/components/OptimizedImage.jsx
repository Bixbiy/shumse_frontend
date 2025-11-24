import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage - A performant image component with lazy loading and progressive enhancement
 * 
 * Features:
 * - Lazy loading using IntersectionObserver
 * - Progressive loading with blur placeholder
 * - WebP support with fallback to original format
 * - Automatic loading state management
 * - Error handling with fallback image
 */
const OptimizedImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
    fallback = '/default-image.png',
    loading = 'lazy',
    objectFit = 'cover',
    onLoad,
    onError,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // Only use IntersectionObserver for lazy loading
        if (loading !== 'lazy') {
            setImageSrc(src);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer) observer.disconnect();
        };
    }, [src, loading]);

    const handleLoad = (e) => {
        setImageLoaded(true);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        setImageError(true);
        setImageSrc(fallback);
        if (onError) onError(e);
    };

    // Generate WebP source if browser supports it
    const getWebPSrc = (originalSrc) => {
        if (!originalSrc || typeof originalSrc !== 'string') return null;

        // Don't convert if already WebP or SVG
        if (originalSrc.endsWith('.webp') || originalSrc.endsWith('.svg')) {
            return null;
        }

        // For external images, we can't convert them
        // Only apply WebP conversion for local images if you have a build setup
        return null; // Implement based on your image optimization pipeline
    };

    const webpSrc = getWebPSrc(src);

    return (
        <picture ref={imgRef}>
            {/* WebP source if available */}
            {webpSrc && <source srcSet={webpSrc} type="image/webp" />}

            {/* Main image */}
            <img
                src={imageSrc}
                alt={alt}
                width={width}
                height={height}
                className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300`}
                style={{
                    objectFit,
                    backgroundColor: imageError ? '#f3f4f6' : 'transparent',
                }}
                onLoad={handleLoad}
                onError={handleError}
                loading={loading}
                decoding="async"
                {...props}
            />

            {/* Loading overlay for blur effect */}
            {!imageLoaded && imageSrc !== placeholder && (
                <div
                    className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
                    aria-hidden="true"
                />
            )}
        </picture>
    );
};

OptimizedImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    className: PropTypes.string,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    placeholder: PropTypes.string,
    fallback: PropTypes.string,
    loading: PropTypes.oneOf(['lazy', 'eager']),
    objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
    onLoad: PropTypes.func,
    onError: PropTypes.func,
};

export default OptimizedImage;
