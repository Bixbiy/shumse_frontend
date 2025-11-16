import { motion } from 'framer-motion';

const RouteTransition = ({ children, isPending }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="relative"
  >
    {children}
    {isPending && (
      <div className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-50" />
    )}
  </motion.div>
);

export default RouteTransition;