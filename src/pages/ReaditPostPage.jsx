/*
 * PATH: src/pages/ReaditPostPage.jsx
 */
import React, { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReaditPost } from '../hooks/useReaditApi';
import Loader from '../components/Loader';
import VoteButtons from '../components/readit/VoteButtons';
import ReaditCommentSection from '../components/readit/ReaditCommentSection';
import { getDay } from '../common/date';
import ReactMarkdown from 'react-markdown';
import SEO from '../common/seo';

const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <i className="fi fi-rr-exclamation text-4xl text-red-500 mb-4"></i>
        <h2 className="text-2xl font-bold">Post not found</h2>
        <Link to="/readit" className="text-blue-500 hover:underline mt-2">Go Home</Link>
    </div>
);

const ReaditPostPage = () => {
    const { postId } = useParams();
    const { post, isLoading, error } = useReaditPost(postId);

    if (isLoading) return <Loader />;
    if (error || !post) return <ErrorDisplay />;

    const { author, title, content, community, createdAt, postType, url, image, votes, commentCount } = post;

    const renderPostContent = () => {
        switch (postType) {
            case 'text':
                return (
                    <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                );
            case 'link':
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                            <i className="fi fi-rr-link"></i>
                            <span className="truncate">{url}</span>
                            <i className="fi fi-rr-arrow-up-right-from-square text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        </div>
                    </a>
                );
            case 'image':
                return (
                    <div className="bg-black rounded-lg overflow-hidden flex justify-center">
                        <img src={image} alt={title} className="max-h-[80vh] max-w-full object-contain" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-2 md:p-6">
            <SEO
                title={`${title} | Readit`}
                description={content?.substring(0, 150) || title}
                image={image || community?.icon}
                type="article"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "DiscussionForumPosting",
                    "headline": title,
                    "text": content,
                    "image": image,
                    "datePublished": createdAt,
                    "author": {
                        "@type": "Person",
                        "name": author?.personal_info?.username
                    },
                    "interactionStatistic": [
                        {
                            "@type": "InteractionCounter",
                            "interactionType": "https://schema.org/LikeAction",
                            "userInteractionCount": votes
                        },
                        {
                            "@type": "InteractionCounter",
                            "interactionType": "https://schema.org/CommentAction",
                            "userInteractionCount": commentCount
                        }
                    ]
                }}
            />

            {/* Post Container */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex">
                    {/* Sidebar Vote */}
                    <div className="w-12 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 pt-4">
                        <VoteButtons item={post} />
                    </div>

                    {/* Content Area */}
                    <div className="p-4 md:p-6 w-full min-w-0">
                        {/* Meta Data */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                            <Link to={`/readit/c/${community?.name}`} className="flex items-center gap-1 font-bold text-black dark:text-white hover:underline">
                                {community?.icon && (
                                    <img src={community.icon} alt="" className="w-5 h-5 rounded-full object-cover" />
                                )}
                                c/{community?.name}
                            </Link>
                            <span className="text-gray-300">•</span>
                            <span>Posted by u/{author?.personal_info?.username}</span>
                            <span>{getDay(createdAt)}</span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                            {title}
                        </h1>

                        <div className="mb-6">
                            {renderPostContent()}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center text-gray-500 text-sm font-bold gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                <i className="fi fi-rr-comment-alt"></i>
                                {commentCount} Comments
                            </div>
                            <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                                <i className="fi fi-rr-share"></i> Share
                            </button>
                            <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                                <i className="fi fi-rr-bookmark"></i> Save
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Comment Section */}
            <Suspense fallback={<div className="py-10 text-center"><Loader /></div>}>
                <ReaditCommentSection post={post} />
            </Suspense>
        </div>
    );
};

export default ReaditPostPage;