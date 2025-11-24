import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if user is typing in input/textarea/contenteditable
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable
            ) {
                return;
            }

            // Ctrl/Cmd + K: Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Search"]');
                if (searchInput) {
                    searchInput.focus();
                } else {
                    navigate('/search');
                }
            }

            // N: New post (only if not holding modifiers)
            if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Check if user is logged in (check for access_token in session)
                const userSession = sessionStorage.getItem('user');
                if (userSession) {
                    navigate('/editor');
                } else {
                    toast.error('Please login to write a story');
                }
            }

            // /: Focus search
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Search"]');
                if (searchInput) {
                    searchInput.focus();
                } else {
                    navigate('/search');
                }
            }

            // Esc: Blur inputs
            if (e.key === 'Escape') {
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    document.activeElement.blur();
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [navigate]);
};
