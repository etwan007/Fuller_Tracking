import { db } from '../src/firebase';
import { collection, addDoc, doc, updateDoc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { parse } from 'cookie';

const GITHUB_API_URL = 'https://api.github.com';

// GitHub API best practices: Rate limiting and user agent headers
const DEFAULT_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Fuller-Tracking/1.0.0', // Best practice: Always include user agent
};

/**
 * Validates GitHub repository name according to GitHub rules
 */
function validateRepositoryName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Repository name is required' };
  }

  const trimmedName = name.trim();
  
  // GitHub repository name validation rules
  if (trimmedName.length === 0) {
    return { valid: false, error: 'Repository name cannot be empty' };
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Repository name cannot exceed 100 characters' };
  }
  
  // GitHub naming rules: can contain alphanumeric characters, hyphens, underscores, and periods
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedName)) {
    return { valid: false, error: 'Repository name can only contain alphanumeric characters, hyphens, underscores, and periods' };
  }
  
  // Cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(trimmedName)) {
    return { valid: false, error: 'Repository name cannot start or end with special characters' };
  }
  
  // Reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(trimmedName.toUpperCase())) {
    return { valid: false, error: 'Repository name cannot be a reserved system name' };
  }
  
  return { valid: true, name: trimmedName };
}

/**
 * Gets the authenticated user's information to properly check repository existence
 */
async function getAuthenticatedUser(token) {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `token ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get user info: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return await response.json();
}

/**
 * Checks if a repository exists for the authenticated user
 */
async function checkRepositoryExists(token, username, repoName) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${repoName}`, {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `token ${token}`,
    },
  });

  if (response.status === 404) {
    return { exists: false };
  }

  if (response.status === 200) {
    const repoData = await response.json();
    return { 
      exists: true, 
      repository: repoData,
      isPrivate: repoData.private 
    };
  }

  // Handle other errors (403 might indicate insufficient permissions)
  const errorBody = await response.text();
  throw new Error(`Failed to check repository existence: ${response.status} ${response.statusText} - ${errorBody}`);
}

/**
 * Creates a new GitHub repository with comprehensive configuration
 */
async function createGitHubRepository(token, config) {
  const requestBody = {
    name: config.name,
    description: config.description || `Repository created from Fuller Tracking for ${config.name}`,
    private: config.private !== undefined ? config.private : true, // Default to private for security
    auto_init: config.autoInit !== undefined ? config.autoInit : true, // Initialize with README
    gitignore_template: config.gitignoreTemplate || null,
    license_template: config.licenseTemplate || null,
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: true,
    delete_branch_on_merge: true, // Best practice: clean up after merging
  };

  const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Failed to create repository: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.message) {
        errorMessage += ` - ${errorJson.message}`;
      }
      if (errorJson.errors && errorJson.errors.length > 0) {
        const errorDetails = errorJson.errors.map(err => err.message || err.code).join(', ');
        errorMessage += ` (${errorDetails})`;
      }
    } catch (parseError) {
      errorMessage += ` - ${errorBody}`;
    }
      throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Syncs a GitHub repository to the Firebase database
 * Uses GitHub repository ID to create unique document keys
 */
async function syncRepositoryToDatabase(githubRepo, uid) {
  try {
    // Create a unique document ID using user ID and GitHub repo ID
    const docId = `${uid}_${githubRepo.id}`;
    const repoDocRef = doc(db, 'repos', docId);
    
    await setDoc(repoDocRef, {
      uid: uid,
      name: githubRepo.name,
      githubId: githubRepo.id,
      owner: githubRepo.owner.login,
      full_name: githubRepo.full_name,
      html_url: githubRepo.html_url,
      description: githubRepo.description,
      private: githubRepo.private,
      language: githubRepo.language,
      stargazers_count: githubRepo.stargazers_count || 0,
      forks_count: githubRepo.forks_count || 0,
      updated_at: githubRepo.updated_at,
      created_at: githubRepo.created_at,
      default_branch: githubRepo.default_branch,
      syncedAt: new Date().toISOString(),
      source: 'github-sync'
    });
    
    console.log(`Repository ${githubRepo.name} synced to database`);
    return docId;
  } catch (error) {
    console.error(`Error syncing repository ${githubRepo.name} to database:`, error);
    throw error;
  }
}

export default async function githubCreateRepoHandler(req, res) {
  // Set CORS headers for better browser compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', supportedMethods: ['POST'] });
    return;
  }
  const { 
    name, 
    taskId, 
    description, 
    private: isPrivate, 
    autoInit, 
    gitignoreTemplate, 
    licenseTemplate,
    uid // Add uid parameter to connect with Firebase user
  } = req.body;

  // Validate repository name
  const nameValidation = validateRepositoryName(name);
  if (!nameValidation.valid) {
    res.status(400).json({ error: nameValidation.error });
    return;
  }

  const sanitizedName = nameValidation.name;
  try {
    // Get GitHub token from cookies or Authorization header
    const cookies = parse(req.headers.cookie || '');
    let githubToken = cookies.github_token;
    
    // Fallback to Authorization header if no cookie token
    if (!githubToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        githubToken = authHeader.substring(7);
      } else if (authHeader.startsWith('token ')) {
        githubToken = authHeader.substring(6);
      }
    }

    if (!githubToken) {
      res.status(401).json({ 
        error: 'Unauthorized: No GitHub token found',
        action: 'Please authenticate with GitHub first' 
      });
      return;
    }

    // Get authenticated user information
    let userInfo;
    try {
      userInfo = await getAuthenticatedUser(githubToken);
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(401).json({ 
        error: 'Invalid or expired GitHub token',
        action: 'Please re-authenticate with GitHub' 
      });
      return;
    }    // Check if repository already exists
    const existenceCheck = await checkRepositoryExists(githubToken, userInfo.login, sanitizedName);
    
    if (existenceCheck.exists) {
      // Repository already exists - sync it to database
      const docId = await syncRepositoryToDatabase(existenceCheck.repository, uid || userInfo.login);

      // Update the task document if taskId is provided
      if (taskId) {
        try {
          const taskRef = doc(db, 'tasks', taskId);
          await updateDoc(taskRef, { repoName: sanitizedName });
        } catch (taskError) {
          console.error('Error updating task:', taskError);
          // Don't fail the entire request if task update fails
        }
      }

      res.status(200).json({ 
        success: true, 
        repoId: docId,
        repository: existenceCheck.repository,
        message: 'Repository already exists - synced to database',
        action: 'existing'
      });
      return;
    }

    // Repository doesn't exist, create it on GitHub first
    const repoConfig = {
      name: sanitizedName,
      description,
      private: isPrivate,
      autoInit,
      gitignoreTemplate,
      licenseTemplate
    };

    const newRepository = await createGitHubRepository(githubToken, repoConfig);
    
    // Sync the newly created repository to database
    const docId = await syncRepositoryToDatabase(newRepository, uid || userInfo.login);

    // Update the task document if taskId is provided
    if (taskId) {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { repoName: sanitizedName });
      } catch (taskError) {
        console.error('Error updating task:', taskError);
        // Don't fail the entire request if task update fails
      }
    }    res.status(201).json({ 
      success: true, 
      repoId: docId,
      repository: newRepository,
      message: 'Repository created successfully',
      action: 'created'
    });

  } catch (error) {
    console.error('GitHub repository creation error:', error);
    
    // Enhanced error handling for different types of failures
    let statusCode = 500;
    let errorMessage = 'Failed to create repository';
    
    if (error.message.includes('422')) {
      statusCode = 422;
      errorMessage = 'Repository name is invalid or already exists';
    } else if (error.message.includes('403')) {
      statusCode = 403;
      errorMessage = 'Insufficient GitHub permissions - please check your OAuth scopes';
    } else if (error.message.includes('401')) {
      statusCode = 401;
      errorMessage = 'GitHub authentication failed - please re-authenticate';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
