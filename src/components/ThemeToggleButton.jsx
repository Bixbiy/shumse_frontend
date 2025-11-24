import React, { useEffect, useState } from 'react';

const ThemeToggleButton = () => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Get theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-grey hover:bg-gray-200 dark:hover:bg-dark-grey transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <i className="fi fi-rr-moon text-xl"></i>
            ) : (
                <i className="fi fi-rr-sun text-xl"></i>
            )}
        </button>
    );
};

export default ThemeToggleButton;
