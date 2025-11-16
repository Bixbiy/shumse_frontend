import React, { useContext, useState } from 'react';
import { userContext } from '../App';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';

const SideNav = () => {
    const { userAuth } = useContext(userContext);
    const {
        profile_img,
        fullname,
        username,
        access_token,
        new_notification_available,
    } = userAuth || {};
    const firstName = fullname ? fullname.split(' ')[0] : '';
    const [activePage, setActivePage] = useState('');
    const [sideNavOpen, setSideNavOpen] = useState(false);

    const toggleSideNav = () => {
        setSideNavOpen((prev) => !prev);
    };

    if (access_token === null) {
        return <Navigate to="/signin" />;
    }

    return (
        <section className="relative flex max-md:flex-col">
            {/* Top Nav for Mobile */}
            <div className="md:hidden bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 sticky top-0 z-40 shadow-sm">
                <button
                    onClick={toggleSideNav}
                    className="text-xl text-gray-800 focus:outline-none"
                    aria-label="Toggle navigation"
                >
                    <i className="fi fi-rr-bars-staggered"></i>
                </button>
                <span className="capitalize font-medium">{activePage}</span>
            </div>

            {/* Sidebar */}
            <div
                className={`bg-white border-r border-gray-200 p-6 pt-4 min-w-[200px] h-screen md:sticky top-24 z-30 transition-transform duration-300 ease-in-out ${sideNavOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:relative fixed md:flex flex-col w-3/4 max-w-[250px]`}
            >
                {/* User Info */}
                <div className="text-xl font-semibold text-dark-gray mb-4">Dashboard</div>
                <div className="flex items-center gap-3 mb-6">
                    <img
                        src={profile_img}
                        alt="profile"
                        className="w-12 h-12 rounded-full border-2 border-info"
                    />
                    <div>
                        <h1 className="font-bold capitalize text-lg">{firstName}</h1>
                        <Link to={`/user/${username}`} className="text-sm text-twitter">
                            @{username}
                        </Link>
                    </div>
                </div>
                <hr className="border-gray-300 mb-4" />

                {/* Posts Link */}
                <NavLink
                    to="/dashboard/blogs"
                    onClick={() => {
                        setActivePage('Posts');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-document text-xl"></i>
                    <span>Posts</span>
                </NavLink>

                {/* Stories Link */}
                <NavLink
                    to="/dashboard/stories"
                    onClick={() => {
                        setActivePage('Stories');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-film text-xl"></i>
                    <span>Stories</span>
                </NavLink>

                {/* Notification Link (with red dot) */}
                <NavLink
                    to="/dashboard/notifications"
                    onClick={() => {
                        setActivePage('Notification');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link relative flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-bell text-xl"></i>                  {
                        new_notification_available ? <span className="bg-red rounded-full w-3 h-3 absolute z-10 top-2 left-2"></span> : ""
                    }

                    <span>Notification</span>


                </NavLink>

                {/* Create Link */}
                <NavLink
                    to="/editor"
                    onClick={() => {
                        setActivePage('Create');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-file-edit text-xl"></i>
                    <span>Create</span>
                </NavLink>

                <hr className="border-gray-300 my-4" />

                <div className="text-xl font-semibold text-dark-gray mb-3">Settings</div>

                {/* Edit Profile Link */}
                <NavLink
                    to="/settings/edit-profile"
                    onClick={() => {
                        setActivePage('Edit Profile');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-user text-xl"></i>
                    <span>Edit Profile</span>
                </NavLink>

                {/* Update Password Link */}
                <NavLink
                    to="/settings/update-password"
                    onClick={() => {
                        setActivePage('Update Password');
                        setSideNavOpen(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-link flex items-center gap-2 py-2 px-3 rounded hover:text-twitter transition ${isActive ? 'text-twitter font-semibold' : 'text-gray-800'
                        }`
                    }
                >
                    <i className="fi fi-rr-lock text-xl"></i>
                    <span>Update Password</span>
                </NavLink>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6">
                <Outlet />
            </div>
        </section>
    );
};

export default SideNav;
