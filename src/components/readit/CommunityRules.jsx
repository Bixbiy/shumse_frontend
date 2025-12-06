/*
 * PATH: src/components/readit/CommunityRules.jsx
 * Community rules display component
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CommunityRules = ({ rules }) => {
    if (!rules || rules.length === 0) return null;

    const [expandedRule, setExpandedRule] = useState(null);

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <i className="fi fi-rr-shield-check text-blue-600"></i>
                Community Rules
            </h3>

            <div className="space-y-3">
                {rules.map((rule, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                    >
                        <button
                            onClick={() => setExpandedRule(expandedRule === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
                                    {index + 1}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {rule.title}
                                </span>
                            </div>
                            <i className={`fi fi-rr-angle-small-${expandedRule === index ? 'up' : 'down'} text-gray-400 transition-transform`}></i>
                        </button>

                        <AnimatePresence>
                            {expandedRule === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30">
                                        {rule.description}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CommunityRules;
