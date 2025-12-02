import React, { useState } from "react";
import { motion } from "framer-motion";

const InputBox = ({
  name,
  type = "text",
  id,
  placeholder,
  icon,
  value,
  onChange,
  disabled = false,
  error,
  helper,
  className = "",
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword
    ? passwordVisible
      ? "text"
      : "password"
    : type;

  return (
    <div className={`relative w-full mb-6 ${className}`}>
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        className="relative"
      >
        <input
          id={id || name}
          name={name}
          type={inputType}
          placeholder={placeholder || ""}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full rounded-xl p-4 pl-12 
            bg-neutral-50 dark:bg-neutral-900 
            border-2 transition-all duration-200
            placeholder:text-neutral-400 dark:placeholder:text-neutral-600
            text-neutral-900 dark:text-white
            ${error
              ? "border-error focus:border-error bg-error/5"
              : "border-transparent focus:border-primary focus:bg-white dark:focus:bg-neutral-800"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          {...props}
        />

        {/* Left Icon */}
        <i className={`fi ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-xl transition-colors duration-200 
          ${isFocused ? "text-primary" : "text-neutral-400"}
          ${error ? "text-error" : ""}
        `} />

        {/* Password Toggle */}
        {isPassword && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-xl cursor-pointer hover:text-primary transition-colors
              ${passwordVisible ? "text-primary" : "text-neutral-400"}
            `}
            onClick={() => setPasswordVisible((v) => !v)}
          >
            <i className={`fi fi-rr-eye${!passwordVisible ? "-crossed" : ""}`} />
          </motion.button>
        )}
      </motion.div>

      {/* Helper / Error Text */}
      <div className="flex justify-between mt-1 px-1">
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-error font-medium flex items-center gap-1"
          >
            <i className="fi fi-rr-info" /> {error}
          </motion.p>
        ) : helper ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{helper}</p>
        ) : null}
      </div>
    </div>
  );
};

export default InputBox;
