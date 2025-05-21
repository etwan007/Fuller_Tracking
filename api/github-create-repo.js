// --- File: /api/github-create-repo.js ---
import fetch from 'node-fetch';

export async function githubCreateRepoHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies?.github_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { repoName } = req.body;
  if (!repoName || repoName.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid repo name' });
  }

  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName.trim(),
      description: 'Repository created via Fuller Tracking app',
      private: false,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    return res.status(response.status).json({ error: errData.message || 'Failed to create repo' });
  }

  res.status(200).json({ message: `Repository "${repoName}" created successfully.` });
}