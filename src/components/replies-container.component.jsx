// components/RepliesContainer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentCard from './comment-card.component';
import NotFoundMsg from './NotFoundMsg';
import toast from 'react-hot-toast';

const RepliesContainer = ({ parentId }) => {
    const [replies, setReplies] = useState([]);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(5);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchReplies = () => {
        setLoading(true);
        axios
            .get(import.meta.env.VITE_SERVER_DOMAIN + `/get-comment-replies/${parentId}`, { params: { skip, limit } })
            .then(({ data }) => {
                setReplies((prev) => [...prev, ...data]);
                setSkip((prev) => prev + data.length);
                if (data.length < limit) setHasMore(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error loading replies.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReplies();
    }, []);

    return (
        <div className="flex flex-col">
            {replies.map((reply, index) => (
                <CommentCard key={reply._id} index={index} leftVal={1} commentData={reply} />
            ))}
            {loading && <div className="text-center py-4">Loading replies...</div>}
            {hasMore && !loading && (
                <button onClick={fetchReplies} className="self-center px-4 py-2 bg-blue-500 text-white rounded mt-2">
                    Load More Replies
                </button>
            )}
            {replies.length === 0 && !loading && <NotFoundMsg message="No replies yet." />}
        </div>
    );
};

export default RepliesContainer;
