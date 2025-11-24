import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../common/api';
import AnimationWrapper from '../common/page-animation';
import PostCard from '../components/BlogPost';

const SimilarPosts = ({ tags, currentPostId }) => {
    const [similarPosts, setSimilarPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tags?.length) {
            setLoading(false);
            return;
        }

        const fetchSimilarPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data } = await api.post(
                    "/similar/posts",
                    {
                        tag: tags[0],
                        blog_id: currentPostId,
                        limit: 6
                    },
                    { timeout: 8000 }
                );

                setSimilarPosts(data);
            } catch (err) {
                console.error('Error loading similar posts:', err);
                setError('Failed to load similar posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchSimilarPosts, 300); // Small delay to prioritize main content

        return () => clearTimeout(timer);
    }, [tags, currentPostId]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center my-6">
                <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
        );
    }

    if (!similarPosts.length) return null;

    return (
        <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    You Might Also Like
                </h2>
                {tags.length > 0 && (
                    <Link
                        to={`/tag/${tags[0]}`}
                        className="flex items-center text-sm text-accent hover:text-accent-dark transition-colors"
                    >
                        View all in {tags[0]}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {similarPosts.map((post, i) => (
                    <AnimationWrapper
                        key={post._id}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                        <div className="h-full">
                            <PostCard
                                content={post}
                                author={post.authorId.personal_info}
                                className="h-full hover:scale-[1.02] transition-transform duration-300"
                            />
                        </div>
                    </AnimationWrapper>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Link
                    to="/blogs"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Explore More Articles
                </Link>
            </div>
        </section>
    );
};

export default React.memo(SimilarPosts);