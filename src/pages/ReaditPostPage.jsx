/*
 * NEW FILE
 * Path: src/pages/ReaditPostPage.jsx
 */
import React, { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReaditPost } from '../hooks/useReaditApi';
import { Helmet } from 'react-helmet-async';
import Loader from '../components/loader.component';
import VoteButtons from '../components/readit/VoteButtons';
import ReaditCommentSection from '../components/readit/ReaditCommentSection'; // We'll create this next
import { getDay } from '../common/date';
import ErrorDisplay from '../components/ErrorDisplay';
import ReactMarkdown from 'react-markdown'; // For rendering markdown content

const ReaditPostPage = () => {
    const { postId } = useParams();
    const { data: post, isLoading, error } = useReaditPost(postId);

    if (isLoading) return <Loader />;
    if (error) return <ErrorDisplay />;

    const { author, title, content, community, createdAt, postType, url, image, votes, commentCount } = post;

    const renderPostContent = () => {
        switch (postType) {
            case 'text':
                // Using ReactMarkdown to render markdown content
                return <ReactMarkdown className="prose dark:prose-invert max-w-none">{content}</ReactMarkdown>;
            case 'link':
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue text-lg hover:underline break-all">
                        {url} <i className="fi fi-rr-arrow-up-right-from-square text-sm ml-1"></i>
                    </a>
                );
            case 'image':
                return <img src={image} alt={title} className="w-full max-h-[70vh] object-contain rounded-md mt-2" />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-2 md:p-4">
            <Helmet>
                <title>{title} | Readit</title>
                <meta name="description" content={content?.substring(0, 150) || title} />
            </Helmet>

            <div className="bg-white dark:bg-grey-dark rounded-lg shadow-md overflow-hidden">
                <div className="flex">
                    <VoteButtons item={post} />
                    <div className="p-4 w-full">
                        <div className="text-xs text-dark-grey mb-1">
                            <Link to={`/readit/c/${community.name}`} className="font-bold hover:underline">
                                <img src={community.icon || '/imgs/logo.png'} alt="" className="w-5 h-5 inline-block rounded-full mr-1"/>
                                c/{community.name}
                            </Link>
                            <span className="mx-1">•</span>
                            Posted by u/{author.personal_info.username}
                            <span className="ml-2">{getDay(createdAt)}</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-3">{title}</h1>
                        
                        <div className="my-4">
                            {renderPostContent()}
                        </div>

                        <div className="flex items-center text-dark-grey text-sm gap-4">
                             <span className="flex items-center">
                                <i className="fi fi-rr-comment-dots mr-2"></i>
                                {commentCount} Comments
                            </span>
                            {/* We can add more buttons here later (Share, Save, etc.) */}
                        </div>

                    </div>
                </div>
            </div>

            {/* --- NEW: Scalable Comment Section --- */}
            <Suspense fallback={<Loader />}>
                <ReaditCommentSection post={post} />
            </Suspense>
        </div>
    );
};

export default ReaditPostPage;