import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component for managing document head meta tags and structured data
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.canonical - Canonical URL
 * @param {string} props.type - Open Graph type (website, article, etc.)
 * @param {string} props.image - Image URL for social sharing
 * @param {Object} props.schema - JSON-LD structured data object
 */
const SEO = ({
    title,
    description,
    canonical,
    type = 'website',
    image,
    schema
}) => {
    const siteName = 'Shums';
    const domain = import.meta.env.VITE_SERVER_DOMAIN || 'https://shums.com';
    const fullUrl = canonical ? (canonical.startsWith('http') ? canonical : `${domain}${canonical}`) : domain;
    const fullImage = image ? (image.startsWith('http') ? image : `${domain}${image}`) : `${domain}/og-image.png`;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{title ? `${title} | ${siteName}` : siteName}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title || siteName} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={title || siteName} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    canonical: PropTypes.string,
    type: PropTypes.string,
    image: PropTypes.string,
    schema: PropTypes.object
};

export default SEO;
