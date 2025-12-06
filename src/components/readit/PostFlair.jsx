/*
 * PATH: src/components/readit/PostFlair.jsx
 * Post flair component with customizable colors
 */
import React from 'react';

const PostFlair = ({ flair, size = 'sm' }) => {
    if (!flair || !flair.text) return null;

    const sizeClasses = {
        xs: 'text-xs px-2 py-0.5',
        sm: 'text-sm px-2.5 py-1',
        md: 'text-base px-3 py-1.5'
    };

    const defaultBg = '#3b82f6'; // Blue
    const defaultText = '#ffffff'; // White

    const backgroundColor = flair.backgroundColor || defaultBg;
    const textColor = flair.color || defaultText;

    return (
        <span
            className={`inline-flex items-center rounded-full font-bold ${sizeClasses[size] || sizeClasses.sm}`}
            style={{
                backgroundColor,
                color: textColor
            }}
            title={`Flair: ${flair.text}`}
        >
            {flair.text}
        </span>
    );
};

export default PostFlair;
