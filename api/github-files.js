import cookie from 'cookie';

export default async function githubFilesHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('GitHub Files API called:', {
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    hasCookie: !!req.headers.cookie
  });

  try {    // Get GitHub token from cookies or Authorization header
    const cookies = cookie.parse(req.headers?.cookie || '');
    let githubToken = cookies.github_token;
    
    console.log('Cookie token:', githubToken ? 'Found' : 'Not found');
    
    // Fallback to Authorization header if no cookie token
    if (!githubToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      console.log('Authorization header present:', !!authHeader);
      
      if (authHeader.startsWith('Bearer ')) {
        githubToken = authHeader.substring(7);
        console.log('Extracted Bearer token:', githubToken ? 'Success' : 'Failed');
      } else if (authHeader.startsWith('token ')) {
        githubToken = authHeader.substring(6);
        console.log('Extracted token auth:', githubToken ? 'Success' : 'Failed');
      }
    }

    if (!githubToken) {
      console.log('No GitHub token available');
      return res.status(401).json({ 
        error: 'Unauthorized: No GitHub token found',
        action: 'Please authenticate with GitHub first' 
      });
    }    console.log('GitHub token found, making API calls...');

    // GitHub API best practices: Include proper headers
    const headers = {
      Authorization: `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Fuller-Tracking/1.0.0'
    };

    // First, get user information for better context
    const userResponse = await fetch('https://api.github.com/user', { headers });

    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Invalid or expired GitHub token',
          action: 'Please re-authenticate with GitHub' 
        });
      }
      const errorText = await userResponse.text();
      return res.status(userResponse.status).json({ 
        error: 'Failed to get user info', 
        details: errorText 
      });
    }

    const userData = await userResponse.json();

    // Get repositories with enhanced parameters for better data
    const reposUrl = new URL('https://api.github.com/user/repos');
    reposUrl.searchParams.set('sort', 'updated'); // Sort by last updated
    reposUrl.searchParams.set('direction', 'desc'); // Most recent first
    reposUrl.searchParams.set('per_page', '100'); // Get more repos (default is 30)
    reposUrl.searchParams.set('type', 'all'); // Include all types of repositories

    const response = await fetch(reposUrl.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'Failed to fetch repositories', 
        details: errorText 
      });
    }

    const repositoriesData = await response.json();

    // Enhanced response with user context and repository metadata
    return res.status(200).json({ 
      files: repositoriesData,
      user: {
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
        public_repos: userData.public_repos,
        private_repos: userData.total_private_repos,
        html_url: userData.html_url
      },
      metadata: {
        total_count: repositoriesData.length,
        fetched_at: new Date().toISOString(),
        api_version: 'v3'
      }
    });

  } catch (error) {
    console.error('Error in githubFilesHandler:', error);
    return res.status(500).json({ 
      error: 'Server error occurred while fetching GitHub data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}