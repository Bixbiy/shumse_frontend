import { motion } from "framer-motion";

const Loader = ({ size = "md", className = "", color = "primary" }) => {
    const sizes = {
        sm: "w-5 h-5 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
    };

    const colors = {
        primary: "border-primary border-t-transparent",
        white: "border-white border-t-transparent",
        neutral: "border-neutral-400 border-t-transparent",
    };

    return (
        <motion.div
            className={`${sizes[size]} ${colors[color]} rounded-full ${className}`}
            animate={{ rotate: 360 }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear",
            }}
        />
    );
};

export default Loader;
