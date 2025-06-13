import { GITHUB_REPO } from "../constants";

/**
 * Sanitizes a string to be a valid GitHub repository name
 * @param {string} name - The original name to sanitize
 * @returns {string} - The sanitized repository name
 */
export function sanitizeRepoName(name) {
  if (!name || typeof name !== 'string') {
    return GITHUB_REPO.DEFAULT_NAME;
  }

  let sanitized = name
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(GITHUB_REPO.NAME_REGEX, "") // Remove invalid characters
    .replace(GITHUB_REPO.CLEANUP_REGEX, "") // Remove leading/trailing dots, dashes, underscores
    .substring(0, GITHUB_REPO.MAX_NAME_LENGTH); // Limit length

  // Fallback if the name becomes empty after sanitization
  if (!sanitized) {
    return GITHUB_REPO.DEFAULT_NAME;
  }

  return sanitized;
}

/**
 * Extracts project name from a bullet point string
 * @param {string} bullet - The bullet point string
 * @returns {string} - The extracted project name
 */
export function extractProjectName(bullet) {
  if (!bullet || typeof bullet !== 'string') {
    return '';
  }

  // Take only the part before the first colon
  return bullet.split(":")[0].trim();
}

/**
 * Creates a repository description from a bullet point
 * @param {string} bullet - The bullet point string
 * @returns {string} - The repository description
 */
export function createRepoDescription(bullet) {
  return `Repository for project: ${bullet}`;
}
