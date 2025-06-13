// --- File: /api/github-login.js ---
export default async function githubLoginHandler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  // GitHub OAuth best practices: Request specific scopes for repository management
  // 'repo' scope includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
  // 'user:email' for getting user's email address
  // 'read:user' for getting user profile information
  const scopes = ['repo', 'user:email', 'read:user'].join(' ');

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${Date.now()}`;

  res.status(200).json({ url: githubAuthUrl });
}