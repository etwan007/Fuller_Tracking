import { db } from '../src/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import cookie from 'cookie';

const GITHUB_API_URL = 'https://api.github.com';

const DEFAULT_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Fuller-Tracking/1.0.0',
};

/**
 * Gets the authenticated user's information
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
 * Gets all repositories for the authenticated user from GitHub
 */
async function getUserRepositories(token) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(`${GITHUB_API_URL}/user/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`, {
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch repositories: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const pageRepos = await response.json();
    repos.push(...pageRepos);

    // If we got fewer repos than per_page, we're done
    if (pageRepos.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Syncs a single GitHub repository to Firebase
 */
async function syncRepositoryToDatabase(githubRepo, uid) {
  const docId = `${uid}_${githubRepo.id}`;
  const repoDocRef = doc(db, 'repos', docId);
  
  await setDoc(repoDocRef, {
    uid: uid,
    name: githubRepo.name,
    githubId: githubRepo.id,
    owner: githubRepo.owner.login,
    full_name: githubRepo.full_name,
    html_url: githubRepo.html_url,
    description: githubRepo.description || '',
    private: githubRepo.private,
    language: githubRepo.language,
    stargazers_count: githubRepo.stargazers_count || 0,
    forks_count: githubRepo.forks_count || 0,
    updated_at: githubRepo.updated_at,
    created_at: githubRepo.created_at,
    default_branch: githubRepo.default_branch,
    topics: githubRepo.topics || [],
    size: githubRepo.size || 0,
    syncedAt: new Date().toISOString(),
    source: 'github-sync'
  });
  
  return docId;
}

/**
 * Removes repositories from Firebase that no longer exist on GitHub
 */
async function removeDeletedRepositories(uid, githubRepoIds) {
  const reposQuery = query(collection(db, 'repos'), where('uid', '==', uid));
  const firebaseRepos = await getDocs(reposQuery);
  
  const deletedCount = 0;
  
  for (const repoDoc of firebaseRepos.docs) {
    const repoData = repoDoc.data();
    const githubId = repoData.githubId;
    
    // If this Firebase repo doesn't exist in GitHub anymore, delete it
    if (!githubRepoIds.has(githubId)) {
      await deleteDoc(doc(db, 'repos', repoDoc.id));
      console.log(`Removed deleted repository: ${repoData.name}`);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

export default async function githubSyncHandler(req, res) {
  // Set CORS headers
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

  try {
    // Get GitHub token from cookies or Authorization header
    const cookies = cookie.parse(req.headers.cookie || '');
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

    // Get Firebase user ID from request body
    const { uid } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'User ID required for syncing' });
      return;
    }

    // Get authenticated user information
    const userInfo = await getAuthenticatedUser(githubToken);
    
    // Get all repositories from GitHub
    const githubRepos = await getUserRepositories(githubToken);
    
    // Track GitHub repo IDs for cleanup
    const githubRepoIds = new Set(githubRepos.map(repo => repo.id));
    
    // Sync each repository to Firebase
    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const repo of githubRepos) {
      try {
        await syncRepositoryToDatabase(repo, uid);
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing repo ${repo.name}:`, error);
        errors.push({ repo: repo.name, error: error.message });
        errorCount++;
      }
    }
    
    // Remove repositories that no longer exist on GitHub
    const deletedCount = await removeDeletedRepositories(uid, githubRepoIds);
    
    res.status(200).json({
      success: true,
      message: 'GitHub repositories synced successfully',
      stats: {
        total: githubRepos.length,
        synced: syncedCount,
        deleted: deletedCount,
        errors: errorCount
      },
      user: {
        login: userInfo.login,
        name: userInfo.name
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to sync repositories';
    
    if (error.message.includes('401')) {
      statusCode = 401;
      errorMessage = 'GitHub authentication failed - please re-authenticate';
    } else if (error.message.includes('403')) {
      statusCode = 403;
      errorMessage = 'Insufficient GitHub permissions';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
