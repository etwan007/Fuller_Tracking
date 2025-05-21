export default async function githubFilesHandler(req, res) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

  const githubToken = req.cookies.github_token;
  if (!githubToken) {
    res.status(401).json({ error: 'Unauthorized: No GitHub token' });
    return;
  }

  const response = await fetch('https://api.github.com/user/repos', {
    headers: { Authorization: `token ${githubToken}` },
  });

  if (!response.ok) {
    res.status(response.status).json({ error: 'Failed to fetch repos' });
    return;
  }

  const data = await response.json();
  res.status(200).json({ files: data });
}
