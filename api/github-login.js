// --- File: /api/github-login.js ---
export default async function githubLoginHandler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = GITHUB_REDIRECT_URI;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;

  res.status(200).json({ url: githubAuthUrl });
}