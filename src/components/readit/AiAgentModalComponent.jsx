import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../Loader';
import toast from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AIAgentModal = ({ mode, postContext, onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const modalTitle = mode === 'post' ? 'AI Post Generator' : 'AI Comment Generator';
    const promptLabel = mode === 'post' ? 'Enter a topic for the post:' : 'AI will generate a reply to this post:';
    const buttonText = mode === 'post' ? 'Generate Post' : 'Generate Comment';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mode === 'post' && !prompt.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            // Get API key from environment
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file');
            }

            // Initialize Gemini AI
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            let fullPrompt = '';

            if (mode === 'post') {
                // Generate both title and content for a post
                fullPrompt = `You are a helpful assistant that creates engaging community posts. Create a post about: "${prompt}". 
                
Please respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"title": "catchy title here", "content": "detailed content here"}

The title should be catchy and under 200 characters. The content should be informative, engaging, and 2-3 paragraphs long.`;
            } else {
                // Generate comment reply
                fullPrompt = `You are a helpful assistant that creates thoughtful comments on posts. 
                
Post Title: "${postContext.title}"
Post Content: "${postContext.content || 'No additional content'}"

Please write a thoughtful, relevant comment or reply to this post. Keep it conversational, friendly, and under 300 words. Respond with ONLY the comment text, no extra formatting.`;
            }

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (mode === 'post') {
                try {
                    // Clean the response - remove markdown code blocks if present
                    let cleanText = text.trim();
                    if (cleanText.startsWith('```json')) {
                        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
                    } else if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
                    }

                    const parsed = JSON.parse(cleanText);
                    onGenerate(parsed.title, parsed.content);
                    toast.success('AI content generated!');
                    onClose();
                } catch (parseError) {
                    console.error('Failed to parse AI response:', text);
                    // Fallback: try to extract title and content manually
                    const titleMatch = text.match(/"title":\s*"([^"]+)"/);
                    const contentMatch = text.match(/"content":\s*"([^"]+)"/);

                    if (titleMatch && contentMatch) {
                        onGenerate(titleMatch[1], contentMatch[1]);
                        toast.success('AI content generated!');
                        onClose();
                    } else {
                        throw new Error('Could not parse AI response. Please try again.');
                    }
                }
            } else {
                // For comments, just use the text directly
                onGenerate(text.trim());
                toast.success('AI comment generated!');
                onClose();
            }

        } catch (err) {
            console.error("AI generation failed:", err);
            const errorMessage = err.message || "Failed to generate content. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-white dark:bg-dark-grey-2 rounded-lg shadow-xl w-full max-w-lg p-6 m-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-dark-grey dark:text-white flex items-center">
                            <i className="fi fi-rr-sparkles text-blue-500 mr-2"></i>
                            {modalTitle}
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-grey">
                            <i className="fi fi-rr-cross text-sm"></i>
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium text-dark-grey dark:text-gray-300 mb-2">
                            {promptLabel}
                        </label>
                        {mode === 'post' ? (
                            <input
                                type="text"
                                className="w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., 'The future of space travel'"
                                required
                            />
                        ) : (
                            <div className="border border-gray-200 dark:border-grey rounded-md p-3 mb-4 bg-gray-50 dark:bg-grey max-h-32 overflow-y-auto">
                                <p className="text-sm font-semibold text-dark-grey dark:text-white line-clamp-1">{postContext.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{postContext.content}</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || (mode === 'post' && !prompt.trim())}
                                className="btn-dark text-sm flex items-center justify-center disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader />
                                ) : (
                                    <i className="fi fi-rr-sparkles mr-2"></i>
                                )}
                                <span>{isLoading ? 'Generating...' : buttonText}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIAgentModal;