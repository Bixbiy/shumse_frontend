import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_COMMUNITY_ICON } from './constants';

const ReaditSidebar = ({ popularCommunities = [], isLoggedIn }) => {
    return (
        <div className="space-y-6">
            {/* Welcome Widget */}
            {!isLoggedIn && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                        <i className="fi fi-rr-alien text-indigo-500"></i> New to Readit?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        Sign up to subscribe to communities and customize your feed.
                    </p>
                    <Link to="/signup" className="btn-primary w-full block text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-full">
                        Join Now
                    </Link>
                </div>
            )}

            {/* Popular Communities Widget */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-800/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Popular Communities</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {popularCommunities && popularCommunities.length > 0 ? (
                        popularCommunities.slice(0, 5).map((comm, i) => (
                            <Link
                                key={comm._id}
                                to={`/readit/c/${comm.name}`}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                            >
                                <span className="font-bold text-gray-400 w-4 text-center text-sm group-hover:text-indigo-500 transition-colors">{i + 1}</span>
                                <img
                                    src={comm.icon || DEFAULT_COMMUNITY_ICON}
                                    alt={`${comm.name} icon`}
                                    className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                                    onError={(e) => { e.target.src = DEFAULT_COMMUNITY_ICON; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate text-gray-900 dark:text-white group-hover:underline">c/{comm.name}</p>
                                    <p className="text-xs text-gray-500">{comm.memberCount || 0} members</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-6 text-center">
                            <i className="fi fi-rr-users-alt text-3xl text-gray-300 dark:text-gray-700 mb-2 block"></i>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No communities yet</p>
                            <Link to="/readit/create-community" className="text-xs text-indigo-500 hover:underline mt-2 inline-block">
                                Create the first one!
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Links */}

        </div>
    );
};

export default ReaditSidebar;
