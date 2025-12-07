import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CommunityCard = ({ community }) => {
    // Fallback data if incomplete community object is passed
    const {
        name = "Community",
        settings = { icon: null, description: "A community for interesting topics." },
        members = [],
        id,
        _id
    } = community || {};

    const communityId = id || _id;
    const memberCount = members.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 p-4 flex items-center space-x-4"
        >
            <div className="flex-shrink-0">
                {settings.icon ? (
                    <img
                        src={settings.icon}
                        alt={name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <Link to={`/readit/${name.toLowerCase()}`} className="block focus:outline-none">
                    <h3 className="text-lg font-bold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                        r/{name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </p>
                </Link>
            </div>

            <div className="flex-shrink-0">
                <Link
                    to={`/readit/${name.toLowerCase()}`}
                    className="px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                >
                    Visit
                </Link>
            </div>
        </motion.div>
    );
};

export default CommunityCard;
