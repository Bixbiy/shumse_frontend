import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const BottomNav = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false); // Hide on scroll down
            } else {
                setIsVisible(true); // Show on scroll up
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const navItems = [
        { to: "/", icon: "fi-rr-home", label: "Home" },
        { to: "/readit", icon: "fi-rr-users-alt", label: "Communities" },
        { to: "/editor", icon: "fi-rr-add", label: "Create", isPrimary: true },
        { to: "/search/trending", icon: "fi-rr-search", label: "Search" },
        { to: "/dashboard/notifications", icon: "fi-rr-bell", label: "Alerts" },
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.nav
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 pb-safe"
                >
                    <div className="flex justify-around items-center h-16 px-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                className={({ isActive }) => `
                  relative flex flex-col items-center justify-center w-full h-full
                  ${item.isPrimary ? "" : "text-neutral-500 dark:text-neutral-400"}
                  ${isActive && !item.isPrimary ? "text-primary dark:text-primary" : ""}
                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {item.isPrimary ? (
                                            <div className="absolute -top-6 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 transform transition-transform active:scale-95">
                                                <i className={`fi ${item.icon} text-xl flex items-center justify-center`} />
                                            </div>
                                        ) : (
                                            <>
                                                <motion.div
                                                    whileTap={{ scale: 0.8 }}
                                                    className="relative"
                                                >
                                                    <i className={`fi ${item.icon} text-xl mb-1 ${isActive ? "font-bold" : ""}`} />
                                                    {isActive && (
                                                        <motion.span
                                                            layoutId="bottomNavIndicator"
                                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                                        />
                                                    )}
                                                </motion.div>
                                                <span className="text-[10px] font-medium">{item.label}</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
};

export default BottomNav;
