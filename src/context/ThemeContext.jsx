import React, { createContext, useState, useEffect, useMemo } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const [systemPrefersDark, setSystemPrefersDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Check system preference and saved theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        setSystemPrefersDark(prefersDark);
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        setMounted(true);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            setSystemPrefersDark(e.matches);
            // Only auto-switch if user hasn't manually set preference
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Apply theme to document with smooth transition
    useEffect(() => {
        if (mounted) {
            const root = document.documentElement;

            // Remove both classes first
            root.classList.remove('light', 'dark');

            // Add new theme class
            root.classList.add(theme);

            // Update meta theme-color for mobile browsers
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
            } else {
                const meta = document.createElement('meta');
                meta.name = 'theme-color';
                meta.content = theme === 'dark' ? '#0f172a' : '#ffffff';
                document.head.appendChild(meta);
            }

            // Save to localStorage
            localStorage.setItem('theme', theme);

            // Set color-scheme for native browser controls
            root.style.colorScheme = theme;
        }
    }, [theme, mounted]);

    const value = useMemo(() => ({
        theme,
        systemPrefersDark,
        toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
        setTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
    }), [theme, systemPrefersDark]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};