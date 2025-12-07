import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UserCard = ({ user, fallbackImage }) => {
  // Safely retrieve properties using optional chaining
  const profileImage = user?.personal_info?.profile_img || user?.profile_img || fallbackImage;
  const username = user?.personal_info?.username || user?.username || 'Unknown';
  const fullname = user?.personal_info?.fullname || user?.fullname || user?.name || 'Unknown User';

  return (
    <Link to={`/user/${username || ''}`}>
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center max-w-sm mx-auto transform transition duration-300 hover:scale-105 hover:shadow-2xl"
      >
        <img
          src={profileImage}
          alt={username}
          className="w-24 h-24 rounded-full object-cover border-2 border-indigo-300"
        />
        <div className="mt-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">{fullname}</h2>
          <p className="text-sm text-gray-500">@{username}</p>
        </div>
      </motion.div>
    </Link>
  );
};

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    personal_info: PropTypes.shape({
      username: PropTypes.string,
      fullname: PropTypes.string,
      profile_img: PropTypes.string,
    }),
  }),
  fallbackImage: PropTypes.string,
};

UserCard.defaultProps = {
  user: {
    id: '',
    personal_info: {
      username: 'Unknown',
      fullname: 'Unknown User',
      profile_img: '',
    },
  },
  fallbackImage: '/imgs/default-avatar.png',
};

export default UserCard;
