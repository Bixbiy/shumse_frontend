/*
 * PATH: src/components/readit/CommunityBanner.jsx
 * Community banner image component with fallback
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CommunityBanner = ({ banner, communityName, className = '' }) => {
    const [imageError, setImageError] = useState(false);

    // Default gradient if no banner
    const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    if (!banner || imageError) {
        return (
            <div
                className={`w-full h-32 md:h-48 bg-gradient-to-r from-blue-500 to-purple-600 ${className}`}
                style={{
                    backgroundImage: defaultGradient,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="w-full h-full bg-black/20 flex items-center justify-center">
                    <h2 className="text-white text-3xl md:text-5xl font-bold drop-shadow-lg">
                        c/{communityName}
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full h-32 md:h-48 overflow-hidden ${className}`}
        >
            <img
                src={banner}
                alt={`${communityName} banner`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                loading="lazy"
            />
        </motion.div>
    );
};

export default CommunityBanner;
