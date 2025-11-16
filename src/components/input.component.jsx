import React, { useState } from "react";

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
  helper
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword
    ? passwordVisible
      ? "text"
      : "password"
    : type;

  return (
    <div className="relative w-full mb-4">
      <input
        id={id || name}
        name={name}
        type={inputType}
        placeholder={placeholder || ""}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-box ${error ? "border-red-500" : ""}`}
      />
      <i className={`fi ${icon} input-icon`} />
      {isPassword && (
        <i
          className={`fi fi-rr-eye${!passwordVisible ? "-crossed" : ""} input-icon right-4 cursor-pointer`}
          onClick={() => setPasswordVisible((v) => !v)}
        />
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500 mt-1">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputBox;
