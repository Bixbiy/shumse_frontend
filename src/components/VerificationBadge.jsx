import React from 'react';
import { MdVerified } from 'react-icons/md';

const VerificationBadge = ({ className = "", size = 16 }) => {
    return (
        <MdVerified
            className={`text-[#1d9bf0] ${className}`}
            size={size}
            aria-label="Verified User"
        />
    );
};

export default VerificationBadge;
