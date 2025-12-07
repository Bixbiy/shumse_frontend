import { useState, useContext } from "react";
import { formatDate } from "../common/date";
import { FiEdit, FiTrash2, FiBarChart2, FiChevronDown, FiChevronUp, FiHeart, FiMessageCircle, FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import api from "../common/api";
import toast, { Toaster } from "react-hot-toast";

// Helper for compact number formatting (e.g. 1.2k)
const formatCompactNumber = (num) => {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(num);
}

export const PostManCard = ({ blog, onEdit, onDelete }) => {
    const { banner, des, title, activity: { total_likes, total_comments, total_reads }, blog_id, publishedAt } = blog;
    const [showStats, setShowStats] = useState(false);
    const { userAuth: { access_token } } = useContext(UserContext)

    const toggleStats = () => {
        setShowStats(!showStats);
    };

    return (
        <div className="group bg-white dark:bg-[#212121] rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300">
            <Toaster />

            <div className="flex flex-col md:flex-row">
                {/* Banner Image - Larger on desktop, full width on mobile */}
                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden">
                    <img
                        src={banner}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        alt={title}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <Link to={`/post/${blog_id}`} className="group-hover:text-amber-500 transition-colors duration-300">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                                    {title}
                                </h3>
                            </Link>
                            <span className="shrink-0 text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                                {formatDate(publishedAt)}
                            </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 leading-relaxed">
                            {des}
                        </p>
                    </div>

                    {/* Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Quick Stats Summary (Always visible) */}
                        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 text-sm">
                            <div className="flex items-center gap-1">
                                <FiHeart className="text-red-500" />
                                <span>{formatCompactNumber(total_likes)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FiMessageCircle className="text-blue-500" />
                                <span>{formatCompactNumber(total_comments)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FiEye className="text-gray-500" />
                                <span>{formatCompactNumber(total_reads)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/editor/${blog_id}`}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                title="Edit"
                            >
                                <FiEdit size={18} />
                            </Link>
                            <button
                                onClick={(e) => deleteBlog(blog, access_token, e.target)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Delete"
                            >
                                <FiTrash2 size={18} />
                            </button>
                            <button
                                onClick={toggleStats}
                                className={`p-2 rounded-full transition-colors ${showStats ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                title="Full Stats"
                            >
                                <FiBarChart2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Stats Section - Animated */}
            {showStats && (
                <div className="bg-gray-50 dark:bg-[#2a2a2a] p-6 animate-fadeIn border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatBox icon={<FiEye size={20} />} label="Reads" value={total_reads} color="indigo" />
                        <StatBox icon={<FiHeart size={20} />} label="Likes" value={total_likes} color="pink" />
                        <StatBox icon={<FiMessageCircle size={20} />} label="Comments" value={total_comments} color="blue" />
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBox = ({ icon, label, value, color }) => {
    // Dynamic color classes based on the `color` prop
    // This is a simple implementation, you might want to map specific tailwind classes if needed
    const colorClasses = {
        indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400",
        pink: "text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400",
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    };

    return (
        <div className={`p-4 rounded-xl flex items-center justify-between ${colorClasses[color] || colorClasses.indigo}`}>
            <div>
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                {icon}
            </div>
        </div>
    );
};


export const DraftManCard = ({ blog }) => {
    let { des, title, blog_id, index } = blog;
    const { userAuth: { access_token } } = useContext(UserContext)
    index++;

    return (
        <div className="group flex items-start gap-4 md:gap-6 p-4 md:p-6 bg-white dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
            <Toaster />

            <span className="flex-none text-4xl font-black text-gray-100 dark:text-gray-800 select-none group-hover:text-amber-500/10 transition-colors">
                {index < 10 ? "0" + index : index}
            </span>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 truncate group-hover:text-amber-500 transition-colors">
                        {title}
                    </h2>
                    <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 rounded-md shrink-0">
                        Draft
                    </span>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {des?.length ? des : "No Description Found"}
                </p>

                <div className="flex items-center gap-4">
                    <Link
                        to={`/editor/${blog_id}`}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                        <FiEdit /> Edit
                    </Link>
                    <button
                        onClick={(e) => deleteBlog(blog, access_token, e.target)}
                        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                        <FiTrash2 /> Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

const deleteBlog = (blog, access_token, target) => {
    const { index, blog_id, setStateFuc } = blog;

    // Find basic parent button if mapped icon is clicked
    const button = target.closest('button') || target;

    button.setAttribute("disabled", "true");
    button.classList.add("opacity-50", "cursor-not-allowed");

    const loadingToast = toast.loading("Deleting blog...");

    api
        .post("/delete-blog", { blog_id })
        .then(({ data }) => {
            button.removeAttribute("disabled");

            setStateFuc((preVal) => {
                let { deletedDocCount, totalDocs, results } = preVal;
                // Create a new array to avoid mutating state directly
                const newResults = [...results];
                newResults.splice(index, 1);

                toast.dismiss(loadingToast);
                toast.success("Blog deleted successfully!");

                // If this was the last item and we have other pages, we might need to handle empty page (though standard pagination usually handles this by fetching prev, simpler here)
                if (!newResults.length && totalDocs - 1 > 0) {
                    // In a real app we might trigger a re-fetch of the previous page
                }

                if (!deletedDocCount) {
                    deletedDocCount = 0;
                }

                return {
                    ...preVal,
                    results: newResults,
                    totalDocs: totalDocs - 1,
                    deleteDocCount: deletedDocCount + 1,
                };
            });
        })
        .catch((err) => {
            console.error("Error deleting blog:", err);
            button.removeAttribute("disabled");
            button.classList.remove("opacity-50", "cursor-not-allowed");
            toast.dismiss(loadingToast);
            toast.error("Failed to delete the blog.");
        });
};
