import { useState } from "react";
import { formatDate } from "../common/date";
import { FiEdit, FiTrash2, FiBarChart2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Link } from "react-router-dom";
import { userContext } from "../App";
import { useContext } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";


export const PostManCard = ({ blog, onEdit, onDelete }) => {
    const { banner, des, title, activity: { total_likes, total_comments, total_reads }, blog_id, publishedAt } = blog;
    const [showStats, setShowStats] = useState(false);
    const { userAuth: { access_token } } = useContext(userContext)

    const toggleStats = () => {
        setShowStats(!showStats);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        if (onEdit) {
            onEdit(blog_id);
        }
    };

    return (<>
        <Toaster />
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 mb-6 hover:shadow-lg">
            {/* Banner Image */}
            <div className="h-48 overflow-hidden">
                <img
                    src={banner}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    alt={title}
                />
            </div>

            {/* Content Area */}
            <div className="p-6">
                {/* Title and Date */}
                <div className="flex justify-between items-start mb-4">
                    <Link to={`/post/${blog_id}`} className="">
                        <h3 className="text-xl hover:text-blue font-bold text-gray-900 line-clamp-2-600 transition-colors">
                            {title}
                        </h3>
                    </Link>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(publishedAt)}
                    </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 line-clamp-3">{des}</p>

                {/* Action Buttons */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                    <div className="flex space-x-2">
                        <Link
                            to={`/editor/${blog_id}`}

                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                            aria-label="Edit post"
                        >
                            <FiEdit className="mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={(e) => deleteBlog(blog, access_token, e.target)}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                            aria-label="Delete post"
                        >
                            <FiTrash2 className="mr-2" />
                            Delete
                        </button>
                    </div>

                    <button
                        onClick={toggleStats}
                        className="flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label={showStats ? "Hide statistics" : "Show statistics"}
                    >
                        <FiBarChart2 className="mr-2" />
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                        {showStats ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </button>
                </div>

                {/* Stats Section - Animated */}
                {showStats && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Post Statistics</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <p className="text-sm text-indigo-600 font-medium">Total Reads</p>
                                <p className="text-2xl font-bold text-indigo-900">{total_reads.toLocaleString()}</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Total Likes</p>
                                <p className="text-2xl font-bold text-green-900">{total_likes.toLocaleString()}</p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Total Comments</p>
                                <p className="text-2xl font-bold text-blue-900">{total_comments.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Additional stats can be added here */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">
                                Last updated: {formatDate(new Date())}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </>
    );
};

export const DraftManCard = ({ blog }) => {
    let { des, title, blog_id, index } = blog;
    const { userAuth: { access_token } } = useContext(userContext)
    index++;
    return (
        <>
            <Toaster />
            <div className="flex gap-5 lg:gap-10 border-b mb-6 border-black border-opacity-30">
                <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">{index < 10 ? "0" + index : index}</h1>

                <div className="">
                    <h1 className="blog-title mb-3 ">{title}</h1>
                    <p className="line-clamp-2 font-gelasio ">{des.length ? des : "No Description Found"}</p>
                    <div className="flex gap-6 mt-3">
                        <Link to={`/editor/${blog_id}`} className="text-blue-600 hover:underline">
                            Edit
                        </Link>
                        <button onClick={(e) => deleteBlog(blog, access_token, e.target)} className="text-red-600 hover:underline">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
const deleteBlog = (blog, access_token, target) => {
    const { index, blog_id, setStateFuc } = blog;
    target.setAttribute("disabled", "true");
    target.classList.add("opacity-50", "cursor-not-allowed");

    axios
        .post(
            import.meta.env.VITE_SERVER_DOMAIN + "/delete-blog",
            { blog_id },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        )
        .then(({ data }) => {
            target.removeAttribute("disabled");
            setStateFuc((preVal) => {
                let { deletedDocCount, totalDocs, results } = preVal;
                results.splice(index, 1);
                toast.success("Blog deleted successfully!");
                if (!results.length && totalDocs - 1 > 0) {
                    return null;
                }

                if (!deletedDocCount) {
                    deletedDocCount = 0;
                }

                return {
                    ...preVal,
                    results: [...results],
                    totalDocs: totalDocs - 1,
                    deleteDocCount: deletedDocCount + 1,
                };
            });
        })
        .catch((err) => {
            console.error("Error deleting blog:", err);
            target.removeAttribute("disabled");
            target.classList.remove("opacity-50", "cursor-not-allowed");
            alert("Failed to delete the blog. Please try again.");
        });
};
