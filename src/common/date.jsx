const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Formats a timestamp into a readable date string (e.g., "15 Jan")
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getDate()} ${months[date.getMonth()]}`;
};

/**
 * Formats a timestamp into a relative time string (e.g., "5 minutes ago")
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Relative time string
 */
export const timeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    // Return 'Just now' if less than 30 seconds
    if (seconds < 30) return 'Just now';

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    // Calculate time difference
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1
                ? `${interval} ${unit} ago`
                : `${interval} ${unit}s ago`;
        }
    }

    // Fallback to full date if more than a year
    return formatFullDate(date);
};

/**
 * Formats a complete date string (e.g., "15 Jan 2023, Monday")
 * @param {Date} date - The date to format
 * @returns {string} Full formatted date string
 */
const formatFullDate = (date) => {
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
};

/**
 * Estimates reading time for content (words or blocks)
 * @param {Array|string} content - The content to analyze (either blocks array or text string)
 * @param {number} [wordsPerMinute=200] - Average reading speed
 * @returns {Object} { minutes: number, text: string }
 */
export const estimateReadingTime = (content, wordsPerMinute = 200) => {
    let wordCount = 0;

    if (Array.isArray(content)) {
        // Handle content blocks (like from editorjs)
        wordCount = content.reduce((count, block) => {
            if (block.text) {
                return count + block.text.split(/\s+/).length;
            }
            return count;
        }, 0);
    } else if (typeof content === 'string') {
        // Handle plain text
        wordCount = content.split(/\s+/).length;
    }

    // Calculate minutes (round up to nearest minute)
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

    // Format output text
    const readingTimeText = minutes === 1
        ? '1 min read'
        : `${minutes} min read`;

    return {
        minutes,
        text: readingTimeText,
        wordCount
    };
};

/**
 * Formats reading time with emoji based on length
 * @param {number} minutes - Reading time in minutes
 * @returns {string} Formatted reading time string
 */
export const formatReadingTime = (minutes = 0) => {
    const emoji = minutes < 2 ? '☕️' : minutes < 5 ? '📖' : '📚';
    return `${emoji} ${minutes} min read`;
};
export const getDay = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    // Calculate difference in days
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    // Format as "15 Jan"
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // If not same year, show year also
    if (year !== now.getFullYear()) {
        return `${day} ${month} ${year}`;
    }

    return `${day} ${month}`;
};

// Export all date utilities as an object
export const dateUtils = {
    formatDate,
    timeAgo,
    formatFullDate,
    estimateReadingTime,
    formatReadingTime
};