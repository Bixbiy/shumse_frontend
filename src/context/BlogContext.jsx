import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// Create separate contexts for data and actions to prevent unnecessary re-renders
const BlogDataContext = createContext(null);
const BlogActionsContext = createContext(null);

export const BlogProvider = ({ children }) => {
    const [blog, setBlog] = useState({});
    const [commentsWrapper, setCommentsWrapper] = useState(false);

    // Memoize the data context value - only changes when blog or commentsWrapper changes
    const dataValue = useMemo(() => ({
        blog,
        commentsWrapper
    }), [blog, commentsWrapper]);

    // Memoize action functions - these never change
    const actionsValue = useMemo(() => ({
        setBlog,
        setCommentsWrapper,
        // Helper to update blog activity without replacing entire blog object
        updateBlogActivity: useCallback((updates) => {
            setBlog(prev => ({
                ...prev,
                activity: {
                    ...prev.activity,
                    ...updates
                }
            }));
        }, [])
    }), []);

    return (
        <BlogDataContext.Provider value={dataValue}>
            <BlogActionsContext.Provider value={actionsValue}>
                {children}
            </BlogActionsContext.Provider>
        </BlogDataContext.Provider>
    );
};

BlogProvider.propTypes = {
    children: PropTypes.node.isRequired
};

// Custom hooks for consuming the contexts
export const useBlogData = () => {
    const context = useContext(BlogDataContext);
    if (!context) {
        throw new Error('useBlogData must be used within a BlogProvider');
    }
    return context;
};

export const useBlogActions = () => {
    const context = useContext(BlogActionsContext);
    if (!context) {
        throw new Error('useBlogActions must be used within a BlogProvider');
    }
    return context;
};

// Legacy hook for backward compatibility (combines both contexts)
export const useBlog = () => {
    const data = useBlogData();
    const actions = useBlogActions();
    return { ...data, ...actions };
};

// For components that need the old postContext pattern
export const postContext = BlogDataContext;
