import { motion, AnimatePresence } from "framer-motion";

// Animation variants for different page types
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

const slideVariants = {
  initial: {
    opacity: 0,
    x: -30,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 30,
  },
};

const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

const AnimationWrapper = ({
  children,
  keyValue,
  transition = { duration: 0.5, ease: "easeInOut" },
  variant = "fade",
  className = ""
}) => {
  const variants = {
    fade: pageVariants,
    slide: slideVariants,
    scale: scaleVariants,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyValue}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[variant]}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimationWrapper;