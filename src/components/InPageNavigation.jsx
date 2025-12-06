import React, { useRef, useState, useEffect, useCallback } from "react";

const InPageNavigation = ({ routes, defaultHidden = [], children, onRouteChange }) => {
  const activeTabLine = useRef(null);
  const [inpageNavIndex, setInpageNavIndex] = useState(0);
  const navButtons = useRef([]);

  // Dynamically update visibility based on screen width
  const isHiddenOnDesktop = (route) =>
    defaultHidden.includes(route) ? "md:hidden" : "";

  // Updates the active tab state and positions the underline indicator.
  const changePageState = useCallback((index) => {
    setInpageNavIndex(index);
    setTimeout(() => {
      const btn = navButtons.current[index];
      if (btn && activeTabLine.current) {
        activeTabLine.current.style.width = `${btn.offsetWidth}px`;
        activeTabLine.current.style.left = `${btn.offsetLeft}px`;
      }
    }, 10); // Small delay to allow layout update
  }, []);

  // When a route is clicked, update state and fire onRouteChange if provided.
  const handleClick = (route, index) => {
    changePageState(index);
    if (onRouteChange) {
      onRouteChange(route);
    }
  };

  // Position the active tab line correctly on mount and updates.
  useEffect(() => {
    changePageState(inpageNavIndex);
  }, [changePageState, inpageNavIndex]);

  return (
    <>
      <div className="relative dark:bg-dark-grey-800 dark:text-white mb-3 bg-white border-b border-dark-grey border-opacity-40 flex flex-nowrap overflow-hidden">
        <div className="flex flex-nowrap items-center space-x-1 md:space-x-2">
          {routes.map((route, i) => (
            <button
              key={i}
              ref={(el) => (navButtons.current[i] = el)}
              className={`p-4 px-5 capitalize transition-all whitespace-nowrap ${
                inpageNavIndex === i ? "text-black font-semibold" : "text-dark-grey opacity-70"
              } ${isHiddenOnDesktop(route)}`}
              onClick={() => handleClick(route, i)}
            >
              {route}
            </button>
          ))}
        </div>
        <hr
          ref={activeTabLine}
          className="absolute bottom-0 h-1 bg-black transition-all duration-300"
        />
      </div>
      {Array.isArray(children) ? children[inpageNavIndex] : children}
    </>
  );
};

export default InPageNavigation;
