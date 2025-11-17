/*
 * NEW FILE
 * Path: src/pages/ReaditCommunityPage.jsx
 */
import React, { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCommunity, useCommunityPosts } from '../hooks/useReaditApi';
import ReaditPostCard from '../components/readit/ReaditPostCard';
import Loader from '../components/loader.component';
import { Helmet } from 'react-helmet-async';
import ErrorDisplay from '../components/ErrorDisplay';

const ReaditCommunityPage = () => {
    const { communityName } = useParams();
    
    // Fetch community details and posts in parallel
    const { data: community, isLoading: isCommunityLoading, error: communityError } = useCommunity(communityName);
    const { data: postData, isLoading: arePostsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunityPosts(communityName, 'hot');

    if (communityError) {
        return <ErrorDisplay />;
    }

    if (isCommunityLoading) {
        return <Loader />;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Helmet>
                <title>{community?.title || 'Community'} | Readit</title>
                <meta name="description" content={community?.description} />
            </Helmet>
            
            {/* Community Banner & Info */}
            <header className="p-4 bg-white dark:bg-grey-dark shadow-md">
                <div className="flex items-center">
                    <img src={community.icon || '/default-icon.png'} alt={`${community.title} icon`} className="w-16 h-16 rounded-full mr-4 border-2 border-grey" />
                    <div>
                        <h1 className="text-3xl font-bold">{community.title}</h1>
                        <p className="text-lg text-dark-grey">c/{community.name}</p>
                    </div>
                </div>
                <p className="mt-2">{community.description}</p>
                <Link 
                    to={`/readit/c/${communityName}/submit`}
                    className="btn-dark mt-4 inline-block"
                >
                    Create Post
                </Link>
            </header>

            {/* Post List */}
            <div className="p-4">
                {arePostsLoading && <Loader />}
                
                <Suspense fallback={<Loader />}>
                    {postData?.pages.map((page, i) => (
                        <React.Fragment key={i}>
                            {page.posts.map(post => (
                                <ReaditPostCard post={post} key={post._id} />
                            ))}
                        </React.Fragment>
                    ))}
                </Suspense>

                {hasNextPage && (
                    <button 
                        onClick={() => fetchNextPage()} 
                        disabled={isFetchingNextPage}
                        className="btn-dark w-full mt-4"
                    >
                        {isFetchingNextPage ? 'Loading...' : 'Load More'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReaditCommunityPage;