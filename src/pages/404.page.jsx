// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import errorImage from '../imgs/not-found.webp';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      {/* Animated overlay for extra visual flair */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-white" />
      </motion.div>
      <div className="relative z-10 text-center">
        <motion.img 
          src={errorImage} 
          alt="404 Error" 
          className="w-64 md:w-80 mb-6 drop-shadow-2xl rounded-full border-4 border-yellow-500"
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.6 }}
        />
        <motion.h1
          className="text-7xl md:text-9xl font-extrabold text-yellow-300 drop-shadow-lg"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>
        <motion.h2
          className="mt-4 text-3xl md:text-4xl font-bold text-white drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Uh-oh, something's missing.
        </motion.h2>
        <motion.p
          className="mt-2 text-lg md:text-xl text-gray-100 max-w-lg mx-auto drop-shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          The page you’re looking for doesn’t exist. It might have been removed or is temporarily unavailable.
        </motion.p>
        <motion.button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-yellow-500 text-gray-800 font-semibold rounded-full shadow-xl hover:bg-yellow-600 transition duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Return Home
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
