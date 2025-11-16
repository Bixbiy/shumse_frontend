import api from "../common/api";

/**
 * REFACTORED to accept a userId
 */
export const fetchComments = async (blogId, page = 0, limit = 5, userId = null) => {
    try {
        if (!blogId || typeof blogId !== 'string') {
            throw new Error('Invalid blogId provided');
        }

        const requestData = {
            blog_id: blogId,
            skip: page * limit,
            limit,
            user_id: userId, // --- ADDED THIS ---
            timestamp: Date.now()
        };
        
        const response = await api.post(
            `/get-post-comments`,
            requestData,
            {
                timeout: 10000,
                validateStatus: (status) => status < 500
            }
        );

        if (response.status !== 200) {
            throw new Error(response.data?.error || `Request failed with status ${response.status}`);
        }

        const comments = Array.isArray(response.data.comments)
            ? response.data.comments.map(comment => ({
                ...comment,
                isLiked: comment.isLiked || false 
            }))
            : [];

        return {
            comments,
            total: Number(response.data.total) || 0,
            hasMore: response.data.hasMore !== false,
            page: Number(response.data.page) || page
        };
    } catch (err) {
        console.error('Fetch Comments Error:', {
            message: err.message,
            url: err.config?.url,
            status: err.response?.status,
            data: err.response?.data
        });

        if (err.response?.status === 401) {
            throw new Error('Please login to view comments');
        } else if (err.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Please try again.');
        }

        throw err;
    }
};