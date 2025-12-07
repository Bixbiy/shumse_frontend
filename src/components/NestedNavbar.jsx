import React from "react";
import { NavLink } from "react-router-dom";

const NestedNavbar = ({ links }) => {
    return (
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center w-full md:w-auto">
            {links.map((link, index) => (
                <NavLink
                    key={index}
                    to={link.path}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-200 text-sm font-medium
                        ${isActive
                            ? "bg-primary/10 text-primary dark:text-primary"
                            : "text-dark-grey dark:text-light-grey hover:bg-gray-100 dark:hover:bg-grey"
                        }`
                    }
                >
                    {link.icon && <i className={`fi ${link.icon} text-lg`}></i>}
                    <span>{link.label}</span>
                </NavLink>
            ))}
        </div>
    );
};

export default NestedNavbar;
