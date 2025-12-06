/**
 * Readit Community System Constants
 * Centralized configuration values to avoid magic numbers
 */

// Sorting Options
export const SORT_OPTIONS = {
    HOT: 'hot',
    NEW: 'new',
    TOP: 'top',
    RISING: 'rising',
    CONTROVERSIAL: 'controversial'
};

export const SORT_LABELS = {
    [SORT_OPTIONS.HOT]: 'Hot',
    [SORT_OPTIONS.NEW]: 'New',
    [SORT_OPTIONS.TOP]: 'Top',
    [SORT_OPTIONS.RISING]: 'Rising',
    [SORT_OPTIONS.CONTROVERSIAL]: 'Controversial'
};

// Time Ranges for "Top" sorting
export const TIME_RANGES = {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
    ALL: 'all'
};

export const TIME_RANGE_LABELS = {
    [TIME_RANGES.HOUR]: 'Past Hour',
    [TIME_RANGES.DAY]: 'Today',
    [TIME_RANGES.WEEK]: 'This Week',
    [TIME_RANGES.MONTH]: 'This Month',
    [TIME_RANGES.YEAR]: 'This Year',
    [TIME_RANGES.ALL]: 'All Time'
};

// Vote Types
export const VOTE_TYPES = {
    UP: 'up',
    DOWN: 'down',
    NONE: 'none'
};

// Pagination
export const POSTS_PER_PAGE = 10;
export const COMMENTS_PER_PAGE = 15;
export const REPLIES_PER_PAGE = 5;

// UI Configuration
export const MAX_COMMENT_DEPTH = 4; // Maximum nesting level for comments
export const MAX_TITLE_LENGTH = 300;
export const MAX_COMMUNITY_NAME_LENGTH = 20;
export const MIN_COMMUNITY_NAME_LENGTH = 3;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Post Types
export const POST_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    LINK: 'link'
};

// Default Images
export const DEFAULT_COMMUNITY_ICON = '/readit.png';
export const DEFAULT_USER_AVATAR = '/default-avatar.png';
