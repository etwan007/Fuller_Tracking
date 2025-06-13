// GitHub API utilities and best practices helper functions

/**
 * GitHub API Constants and Best Practices
 */
export const GITHUB_CONFIG = {
  API_BASE_URL: 'https://api.github.com',
  OAUTH_SCOPES: {
    REPO: 'repo', // Full repository access
    PUBLIC_REPO: 'public_repo', // Public repository access only
    USER_EMAIL: 'user:email', // User email access
    READ_USER: 'read:user', // Read user profile
    WRITE_REPO_HOOK: 'write:repo_hook', // Write repository hooks
    READ_REPO_HOOK: 'read:repo_hook', // Read repository hooks
  },
  HEADERS: {
    ACCEPT: 'application/vnd.github.v3+json',
    USER_AGENT: 'Fuller-Tracking/1.0.0',
  },
  RATE_LIMITS: {
    AUTHENTICATED: 5000, // Requests per hour with auth
    UNAUTHENTICATED: 60, // Requests per hour without auth
  }
};

/**
 * Validates GitHub repository name according to GitHub's rules
 * @param {string} name - Repository name to validate
 * @returns {Object} - Validation result with valid boolean and sanitized name
 */
export function validateGitHubRepoName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Repository name is required' };
  }

  let sanitized = name.trim();
  
  // Basic validation
  if (sanitized.length === 0) {
    return { valid: false, error: 'Repository name cannot be empty' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Repository name cannot exceed 100 characters' };
  }
  
  // GitHub naming rules
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    return { valid: false, error: 'Repository name can only contain alphanumeric characters, hyphens, underscores, and periods' };
  }
  
  // Cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(sanitized)) {
    return { valid: false, error: 'Repository name cannot start or end with special characters' };
  }
  
  // Reserved names check
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(sanitized.toUpperCase())) {
    return { valid: false, error: 'Repository name cannot be a reserved system name' };
  }
  
  return { valid: true, name: sanitized };
}

/**
 * Sanitizes a project name to be GitHub repository compliant
 * @param {string} projectName - Original project name
 * @returns {string} - Sanitized repository name
 */
export function sanitizeForGitHub(projectName) {
  if (!projectName) return 'new-repository';
  
  let sanitized = projectName
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .substring(0, 100); // Limit length
  
  // Fallback if empty
  if (!sanitized) {
    sanitized = 'new-repository';
  }
  
  return sanitized;
}

/**
 * Creates a standardized GitHub API request configuration
 * @param {string} token - GitHub access token
 * @param {Object} options - Additional options
 * @returns {Object} - Request configuration
 */
export function createGitHubRequestConfig(token, options = {}) {
  return {
    headers: {
      ...GITHUB_CONFIG.HEADERS,
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
}

/**
 * Handles GitHub API errors with proper error mapping
 * @param {Response} response - Fetch response object
 * @param {string} errorBody - Response body text
 * @returns {Error} - Formatted error object
 */
export function handleGitHubAPIError(response, errorBody) {
  let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
  let userMessage = 'An error occurred while communicating with GitHub';
  
  try {
    const errorJson = JSON.parse(errorBody);
    if (errorJson.message) {
      errorMessage += ` - ${errorJson.message}`;
      userMessage = errorJson.message;
    }
    if (errorJson.errors && errorJson.errors.length > 0) {
      const errorDetails = errorJson.errors.map(err => err.message || err.code).join(', ');
      errorMessage += ` (${errorDetails})`;
    }
  } catch (parseError) {
    errorMessage += ` - ${errorBody}`;
  }
  
  // Map common HTTP status codes to user-friendly messages
  switch (response.status) {
    case 401:
      userMessage = 'Authentication failed. Please re-authenticate with GitHub.';
      break;
    case 403:
      userMessage = 'Insufficient permissions. Please check your GitHub OAuth scopes.';
      break;
    case 404:
      userMessage = 'Repository or resource not found.';
      break;
    case 422:
      userMessage = 'Invalid request data. Please check your input.';
      break;
    case 429:
      userMessage = 'GitHub API rate limit exceeded. Please try again later.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      userMessage = 'GitHub is experiencing issues. Please try again later.';
      break;
  }
  
  const error = new Error(errorMessage);
  error.status = response.status;
  error.userMessage = userMessage;
  error.originalBody = errorBody;
  
  return error;
}

/**
 * Repository configuration templates for common use cases
 */
export const REPO_TEMPLATES = {
  DEFAULT: {
    private: true,
    auto_init: true,
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: true,
    delete_branch_on_merge: true,
  },
  
  OPEN_SOURCE: {
    private: false,
    auto_init: true,
    allow_squash_merge: true,
    allow_merge_commit: false,
    allow_rebase_merge: true,
    delete_branch_on_merge: true,
    has_issues: true,
    has_wiki: true,
    has_projects: true,
  },
  
  PRIVATE_PROJECT: {
    private: true,
    auto_init: true,
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true,
    has_issues: true,
    has_wiki: false,
    has_projects: true,
  }
};

/**
 * Common .gitignore templates
 */
export const GITIGNORE_TEMPLATES = {
  NODE: 'Node',
  PYTHON: 'Python',
  JAVA: 'Java',
  CSHARP: 'VisualStudio',
  CPP: 'C++',
  REACT: 'Node', // React uses Node template
  GOLANG: 'Go',
  RUBY: 'Ruby',
  SWIFT: 'Swift',
  KOTLIN: 'Kotlin',
};

/**
 * Common license templates
 */
export const LICENSE_TEMPLATES = {
  MIT: 'mit',
  APACHE_2: 'apache-2.0',
  GPL_3: 'gpl-3.0',
  BSD_3: 'bsd-3-clause',
  BSD_2: 'bsd-2-clause',
  ISC: 'isc',
  UNLICENSE: 'unlicense',
};

/**
 * Rate limiting helper to manage API calls
 */
export class GitHubRateLimiter {
  constructor() {
    this.lastCall = 0;
    this.minInterval = 1000; // 1 second between calls minimum
  }
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
  }
}

// Export a global rate limiter instance
export const githubRateLimiter = new GitHubRateLimiter();
