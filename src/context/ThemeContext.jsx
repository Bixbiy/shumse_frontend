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
        setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        setMounted(true);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setSystemPrefersDark(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (mounted) {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme, mounted]);

    const value = useMemo(() => ({
        theme,
        systemPrefersDark,
        toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
        setTheme
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