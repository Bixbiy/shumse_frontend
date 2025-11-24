import DOMPurify from 'dompurify';

export const storeInSession = (key, value) => {
  try {
    const storedValue = typeof value === "object" ? JSON.stringify(value) : value;
    sessionStorage.setItem(key, storedValue);
  } catch (error) {
    console.error("Error storing in session:", error);
  }
};

const ALLOWED_KEYS = ['user', 'theme', 'recent_searches'];

export const lookInSession = (key) => {
  // Security: Only allow specific keys
  if (!ALLOWED_KEYS.includes(key)) {
    return null;
  }

  const data = sessionStorage.getItem(key);
  if (!data) return null;

  try {
    // Try parsing as JSON
    const parsed = JSON.parse(data);

    // Sanitize if it's an object/string
    if (typeof parsed === 'object' && parsed !== null) {
      return sanitizeObject(parsed);
    }
    if (typeof parsed === 'string') {
      return DOMPurify.sanitize(parsed);
    }
    return parsed;
  } catch {
    // If not JSON, return sanitized string
    return DOMPurify.sanitize(data);
  }
};

// Helper to recursively sanitize objects
// CRITICAL FIX: Exclude auth tokens and IDs from sanitization to prevent corruption
const SANITIZATION_EXCLUDE = ['access_token', '_id', 'blog_id', 'comment_id', 'user_id', 'post_id'];

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Don't sanitize tokens, IDs, or other cryptographic/DB fields
    if (SANITIZATION_EXCLUDE.includes(key)) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = DOMPurify.sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const removeFromSession = (key) => {
  sessionStorage.removeItem(key);
};

export const logoutUser = () => {
  sessionStorage.clear();
};