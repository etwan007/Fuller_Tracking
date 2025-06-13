import { db } from '../src/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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
    licenseTemplate 
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
    }

    // Check if repository already exists
    const existenceCheck = await checkRepositoryExists(githubToken, userInfo.login, sanitizedName);
    
    if (existenceCheck.exists) {
      // Repository already exists - return success with existing repo info
      const repoDoc = await addDoc(collection(db, 'repos'), { 
        name: sanitizedName,
        githubId: existenceCheck.repository.id,
        owner: userInfo.login,
        fullName: existenceCheck.repository.full_name,
        htmlUrl: existenceCheck.repository.html_url,
        private: existenceCheck.repository.private,
        createdAt: new Date().toISOString(),
        source: 'existing'
      });

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
        repoId: repoDoc.id,
        repository: existenceCheck.repository,
        message: 'Repository already exists - linked successfully',
        action: 'existing'
      });
      return;
    }

    // Repository doesn't exist, create it
    const repoConfig = {
      name: sanitizedName,
      description,
      private: isPrivate,
      autoInit,
      gitignoreTemplate,
      licenseTemplate
    };

    const newRepository = await createGitHubRepository(githubToken, repoConfig);

    // Add the repository to the Firestore `repos` collection
    const repoDoc = await addDoc(collection(db, 'repos'), { 
      name: sanitizedName,
      githubId: newRepository.id,
      owner: userInfo.login,
      fullName: newRepository.full_name,
      htmlUrl: newRepository.html_url,
      private: newRepository.private,
      createdAt: new Date().toISOString(),
      source: 'created'
    });

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

    res.status(201).json({ 
      success: true, 
      repoId: repoDoc.id,
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
