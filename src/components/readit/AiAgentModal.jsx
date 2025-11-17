import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Loader from '../loader.component';

// This is the Gemini API call function as defined in the instructions
const callGeminiAPI = async (prompt, systemInstruction = "") => {
    // IMPORTANT: Your API key is loaded from .env variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        ...(systemInstruction && {
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
        })
    };

    try {
        let response;
        let delay = 1000;
        for (let i = 0; i < 3; i++) { // Exponential backoff
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) break;
            if (response.status === 429 || response.status >= 500) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                break;
            }
        }

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Body:", errorBody);
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        } else {
            console.error("Unexpected API response:", result);
            if(result.promptFeedback?.blockReason){
                throw new Error(`Content blocked: ${result.promptFeedback.blockReason}`);
            }
            throw new Error("Failed to get valid text from Gemini API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};


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
        
        let systemInstruction = "";
        let userPrompt = "";

        try {
            if (mode === 'post') {
                systemInstruction = "You are a creative community forum poster. Generate a post title and content based on the user's topic. Format your response *only* as JSON: {\"title\": \"Your Title\", \"content\": \"Your Content\"}. The content should be a few paragraphs long.";
                userPrompt = `Topic: ${prompt}`;
            } else { // mode === 'comment'
                systemInstruction = "You are a helpful community commenter. Write a concise and relevant comment based on the post. Respond with *only* the comment text, no greetings or extra formatting.";
                userPrompt = `Generate a comment for this post:\nTitle: ${postContext.title}\nContent: ${postContext.content || ''}`;
            }
            
            const response = await callGeminiAPI(userPrompt, systemInstruction);
            
            if (mode === 'post') {
                try {
                    // Try to parse as JSON
                    const jsonResponse = JSON.parse(response);
                    onGenerate(jsonResponse.title, jsonResponse.content);
                } catch (parseError) {
                    // Fallback if JSON parsing fails
                    console.warn("AI did not return valid JSON, using fallback.");
                    onGenerate(prompt, response.trim()); // Use prompt as title
                }
            } else { // mode === 'comment'
                onGenerate(response.trim());
            }
            
        } catch (err) {
            console.error("AI generation failed:", err);
            setError(`Failed to generate content: ${err.message}. Please try again.`);
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