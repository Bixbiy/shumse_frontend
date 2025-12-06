/*
 * PATH: src/components/readit/CommunityStatusBadge.jsx
 * Community approval status badge component
 */
import React from 'react';
import { motion } from 'framer-motion';

const CommunityStatusBadge = ({ status }) => {
    if (!status || status === 'approved') return null; // Don't show badge for approved

    const getStatusConfig = () => {
        switch (status) {
            case 'pending':
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    text: 'text-yellow-800 dark:text-yellow-300',
                    icon: 'fi-rr-clock',
                    label: 'Pending Approval'
                };
            case 'rejected':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'text-red-800 dark:text-red-300',
                    icon: 'fi-rr-cross-circle',
                    label: 'Rejected'
                };
            case 'deleted':
                return {
                    bg: 'bg-gray-100 dark:bg-gray-900/30',
                    text: 'text-gray-800 dark:text-gray-300',
                    icon: 'fi-rr-trash',
                    label: 'Deleted'
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}
        >
            <i className={`fi ${config.icon}`}></i>
            {config.label}
        </motion.div>
    );
};

export default CommunityStatusBadge;
