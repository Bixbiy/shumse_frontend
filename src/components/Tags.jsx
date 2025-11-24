import React, { useState } from 'react';

const defaultTags = ["Gaming", "News", "Tech", "Lifestyle", "Sports", "Entertainment", "Films"];

const Tags = ({ tags = [], setTags }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && tags.length < 5) {
            e.preventDefault();
            if (input.trim() !== '') {
                setTags([...tags, input.trim()]);
                setInput('');
            }
        }
    };

    const handleRemoveTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleAddDefaultTag = (tag) => {
        if (tags.length < 5 && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
    };

    return (
        <div className="tags-input p-4 bg-white shadow-lg rounded-lg">
            <div className="flex flex-wrap items-center mb-4">
                {tags.map((tag, index) => (
                    <div key={index} className="tag bg-gray-200 rounded-full px-3 py-1 m-1 flex items-center shadow-sm">
                        <span className="mr-2 text-gray-700">#{tag}</span>
                        <button
                            type="button"
                            className="text-red-500 ml-2 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                            onClick={() => handleRemoveTag(index)}
                            aria-label={`Remove tag ${tag}`}
                        >
                            <i className="fi fi-br-cross text-[10px]"></i>
                        </button>
                    </div>
                ))}
                {tags.length < 5 && (
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add Topics"
                        className="input-box border border-dark-grey rounded-full pl-4 py-2 m-1 flex-grow shadow-sm"
                        aria-label="Add a topic"
                    />
                )}
            </div>
            <div className="flex flex-wrap items-center">
                <p className="text-gray-600 mb-2 w-full">Suggested Topics</p>
                {defaultTags.map((tag, index) => (
                    <button
                        key={index}
                        type="button"
                        className="bg-dark-grey bg-opacity-30 hover:bg-opacity-40 text-gray-700 rounded-full px-3 py-1 m-1 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                        onClick={() => handleAddDefaultTag(tag)}
                        aria-label={`Add tag ${tag}`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tags;