import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const variants = {
    primary: "bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/30",
    secondary: "bg-secondary text-white hover:bg-secondary-600 shadow-lg shadow-secondary/30",
    outline: "border-2 border-primary text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20",
    ghost: "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    danger: "bg-error text-white hover:bg-error-dark shadow-lg shadow-error/30",
    dark: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/30 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
    light: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
};

const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    icon: "p-3",
};

const Button = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    isLoading = false,
    disabled = false,
    icon,
    type = "button",
    onClick,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type={type}
            className={`
        relative flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            onClick={onClick}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isLoading && icon && <span className="text-xl">{icon}</span>}
            {children}
        </motion.button>
    );
};

export default Button;
