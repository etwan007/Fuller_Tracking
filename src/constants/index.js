// Application constants
export const POLLING_INTERVALS = {
  FORM_RESPONSES: 60000, // 1 minute
  GITHUB_SYNC: 60000,    // 1 minute
};

export const API_ENDPOINTS = {
  AI: '/api/ai',
  GOOGLE_CALENDAR: '/api/google-calendar',
  GOOGLE_FORM_RESPONSES: '/api/google-form-responses',
  GITHUB_SYNC: '/api/github-sync',
  GITHUB_CREATE_REPO: '/api/github-create-repo',
};

export const LOCAL_STORAGE_KEYS = {
  GOOGLE_ACCESS_TOKEN: 'google_access_token',
  GITHUB_ACCESS_TOKEN: 'github_access_token',
  PENDING_GITHUB_LINK: 'pendingGithubLink',
  PENDING_GITHUB_CREDENTIAL: 'pendingGithubCredential',
};

export const GITHUB_REPO = {
  MAX_NAME_LENGTH: 100,
  DEFAULT_NAME: 'new_repository',
  NAME_REGEX: /[^a-zA-Z0-9._-]/g,
  CLEANUP_REGEX: /^[._-]+|[._-]+$/g,
};

export const AI_PROMPTS = {
  PROJECT_IDEAS: (projectName) => 
    `Give me 5 unique and creative project ideas based on this concept. Each idea should be presented as a single bullet point and must begin with a unique, descriptive project name that relates to the concept. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools and components, unless otherwise specified. Do not split ideas into multiple bullets. Separate each idea with a line break.: ${projectName}`,
  
  CLARIFICATION: (projectName, currentBreakdown, clarification) =>
    `Given the original project idea: ${projectName}, and the previous breakdown: ${currentBreakdown}, here is a new clarification or modification: ${clarification}. Based on this updated input, generate 5 revised or entirely new project ideas. Each idea must be presented as a single bullet point starting with a unique, relevant project name. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools (including 3D printing, CNC router, soldering iron, welding, etc.) and components, unless otherwise specified. Do not reuse the original ideas with minor wording changes. Separate each idea with a line break.`,
};
