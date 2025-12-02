import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import BottomNav from "./BottomNav";
import Footer from "../Footer";

const AppLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Desktop/Tablet Navbar */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Top Bar (Simplified) */}
            <div className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
                <img src="/logo.png" alt="Logo" className="h-8" />
                <div className="flex items-center gap-3">
                    {/* Add mobile specific top actions here if needed */}
                </div>
            </div>

            <main className="flex-1 pb-20 md:pb-0">
                <Outlet />
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default AppLayout;
