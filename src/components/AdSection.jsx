import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Import your ad image correctly (make sure the path is accurate)
import adImage from "../imgs/full-logo.png";

const AdSection = () => {
  // Array of possible color schemes
  const colorSchemes = [
    { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', border: 'border-blue-200', text: 'text-blue-600' },
    { bg: 'bg-gradient-to-r from-green-50 to-teal-50', border: 'border-green-200', text: 'text-green-600' },
    { bg: 'bg-gradient-to-r from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-600' },
    { bg: 'bg-gradient-to-r from-yellow-50 to-orange-50', border: 'border-yellow-200', text: 'text-yellow-600' },
    { bg: 'bg-gradient-to-r from-red-50 to-pink-50', border: 'border-red-200', text: 'text-red-600' },
  ];

  // Array of possible ad styles
  const adStyles = [
    { shape: 'rounded-lg', shadow: 'shadow-md' },
    { shape: 'rounded-xl', shadow: 'shadow-lg' },
    { shape: 'rounded-2xl', shadow: 'shadow-xl' },
    { shape: 'rounded-full', shadow: 'shadow-md' },
  ];

  // Array of possible ad sizes
  const adSizes = [
    { width: 'w-full', height: 'h-40' },
    { width: 'w-11/12', height: 'h-48' },
    { width: 'w-5/6', height: 'h-44' },
    { width: 'w-full', height: 'h-52' },
  ];

  // State for random selections
  const [currentScheme, setCurrentScheme] = useState(colorSchemes[0]);
  const [currentStyle, setCurrentStyle] = useState(adStyles[0]);
  const [currentSize, setCurrentSize] = useState(adSizes[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [adContent, setAdContent] = useState({
    type: 'image',
    content: adImage,
    alt: 'Advertisement Banner'
  });

  // Randomly select styles when component mounts
  useEffect(() => {
    const randomizeStyles = () => {
      setCurrentScheme(colorSchemes[Math.floor(Math.random() * colorSchemes.length)]);
      setCurrentStyle(adStyles[Math.floor(Math.random() * adStyles.length)]);
      setCurrentSize(adSizes[Math.floor(Math.random() * adSizes.length)]);
      setIsVisible(true);

      // Occasionally use text instead of image (30% chance)
      if (Math.random() < 0.3) {
        const textAds = [
          "Upgrade to Premium for exclusive content!",
          "Limited time offer: 50% off all courses!",
          "Join our community of 10,000+ readers!",
          "New eBook available - Download now!",
          "Subscribe to our newsletter for weekly insights!"
        ];
        setAdContent({
          type: 'text',
          content: textAds[Math.floor(Math.random() * textAds.length)],
          cta: "Learn More"
        });
      } else {
        setAdContent({
          type: 'image',
          content: adImage,
          alt: 'Advertisement Banner'
        });
      }
    };

    randomizeStyles();

    // Change styles periodically (every 10-20 seconds)
    const interval = setInterval(randomizeStyles, 10000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if image is loaded
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      className={`ad-section my-8 p-4 ${currentScheme.bg} border ${currentScheme.border} ${currentStyle.shape} ${currentStyle.shadow} mx-auto ${currentSize.width}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className={`text-center text-lg font-medium mb-3 ${currentScheme.text}`}>
        Advertisement
        <span className="text-xs ml-2 bg-white/30 px-2 py-1 rounded-full">
          Sponsored
        </span>
      </h3>

      <motion.div
        className={`flex justify-center items-center ${currentSize.height} bg-white/50 ${currentStyle.shape} overflow-hidden relative`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {adContent.type === 'text' ? (
          <div className="text-center p-4">
            <p className="text-lg font-medium mb-2">{adContent.content}</p>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
              {adContent.cta}
            </button>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <motion.img
              src={adContent.content}
              alt={adContent.alt}
              className={`max-h-full max-w-full object-contain p-2 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error("Failed to load ad image");
                setAdContent({
                  type: 'text',
                  content: "Special offer just for you!",
                  cta: "Click Here"
                });
              }}
            />
          </>
        )}
      </motion.div>

      <div className="text-center mt-2 text-xs text-gray-500">
        Ads help support our content
      </div>
    </motion.div>
  );
};

export default React.memo(AdSection);