import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({ smooth = true, behavior = 'smooth' }) => {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const userScroll = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      userScroll.current = window.scrollY > 0;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      // Only scroll if user hasn't manually scrolled
      if (!userScroll.current) {
        window.scrollTo({
          top: 0,
          behavior: smooth ? behavior : 'auto'
        });
      }
      
      // Reset scroll tracking for new page
      userScroll.current = false;
      previousPath.current = pathname;
    }
  }, [pathname, smooth, behavior]);

  return null;
};

export default ScrollToTop;