import React from "react";
import { motion } from "framer-motion";

const Card = ({ children, className = "", hover = true, glass = false, ...props }) => {
    return (
        <motion.div
            whileHover={hover ? { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
            className={`
        rounded-2xl p-6 transition-all duration-300
        ${glass
                    ? "bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-white/20 dark:border-neutral-700/30"
                    : "bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-sm"}
        ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
