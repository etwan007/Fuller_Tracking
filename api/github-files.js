// --- File: /api/github-files.js ---
import fetch from 'node-fetch';

export async function githubFilesHandler(req, res) {
  const token = req.cookies?.github_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const response = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch repos' });
  }

  const repos = await response.json();
  const files = repos.map((repo) => ({
    id: repo.id,
    path: repo.full_name,
    private: repo.private,
    url: repo.html_url,
  }));

  res.status(200).json({ files });
}