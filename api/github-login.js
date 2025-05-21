// --- File: /api/github-login.js ---
export default async function githubLoginHandler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = 'https://fuller-tracking.vercel.app/api/github-callback';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;

  res.status(200).json({ url: githubAuthUrl });
}