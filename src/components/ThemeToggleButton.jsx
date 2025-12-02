import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggleButton = () => {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Get theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        setMounted(true);

        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Smooth transition
        document.documentElement.style.setProperty('color-scheme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Prevent flash on initial render
    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors overflow-hidden"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <AnimatePresence mode="wait">
                {theme === 'light' ? (
                    <motion.i
                        key="moon"
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="fi fi-rr-moon text-xl text-neutral-700"
                    />
                ) : (
                    <motion.i
                        key="sun"
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="fi fi-rr-sun text-xl text-yellow-400"
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default ThemeToggleButton;
