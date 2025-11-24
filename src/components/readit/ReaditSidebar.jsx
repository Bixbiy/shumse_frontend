import React from 'react';
import { Link } from 'react-router-dom';

const ReaditSidebar = ({ popularCommunities, isLoggedIn }) => {
    return (
        <div className="space-y-6">
            {/* Welcome Widget */}
            {!isLoggedIn && (
                <div className="card-padded bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 border-orange-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <i className="fi fi-rr-alien text-orange-500"></i> New to Readit?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Sign up to subscribe to communities and customize your feed.
                    </p>
                    <Link to="/signup" className="btn-primary w-full block text-center">
                        Join Now
                    </Link>
                </div>
            )}

            {/* Popular Communities Widget */}
            <div className="card overflow-hidden">
                <div className="card-header bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">Popular Communities</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {popularCommunities.slice(0, 5).map((comm, i) => (
                        <Link
                            key={comm._id}
                            to={`/readit/c/${comm.name}`}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="font-bold text-gray-400 w-4 text-center text-sm">{i + 1}</span>
                            <img src={comm.icon || '/default-community.png'} alt={comm.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-900 dark:text-white">c/{comm.name}</p>
                                <p className="text-xs text-gray-500">{comm.memberCount} members</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer Links */}
            <div className="text-xs text-gray-400 px-2 flex flex-wrap gap-x-4 gap-y-2">
                <Link to="#" className="hover:underline">Privacy Policy</Link>
                <Link to="#" className="hover:underline">User Agreement</Link>
                <span>© 2025 Readit</span>
            </div>
        </div>
    );
};

export default ReaditSidebar;
