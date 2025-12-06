/*
 * PATH: src/components/readit/AnimatedCounter.jsx
 * Animated number counter for smooth vote/count transitions
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedCounter = ({ value, className = '', format = 'compact' }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValue = useRef(value);

    // Spring animation for smooth counting
    const springValue = useSpring(value, {
        stiffness: 100,
        damping: 15
    });

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', (latest) => {
            setDisplayValue(Math.round(latest));
        });
        return unsubscribe;
    }, [springValue]);

    // Determine animation direction
    const direction = value > prevValue.current ? 'up' : value < prevValue.current ? 'down' : 'none';

    useEffect(() => {
        prevValue.current = value;
    }, [value]);

    // Format the number
    const formattedValue = format === 'compact'
        ? Intl.NumberFormat('en-US', { notation: 'compact' }).format(displayValue)
        : displayValue.toLocaleString();

    return (
        <motion.span
            key={value}
            initial={{
                y: direction === 'up' ? 10 : direction === 'down' ? -10 : 0,
                opacity: 0
            }}
            animate={{ y: 0, opacity: 1 }}
            className={`inline-block tabular-nums ${className}`}
        >
            {formattedValue}
        </motion.span>
    );
};

export default AnimatedCounter;
