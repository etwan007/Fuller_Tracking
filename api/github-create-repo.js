export default async function githubCreateRepoHandler(req, res) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const githubToken = req.cookies.github_token;
  if (!githubToken) {
    res.status(401).json({ error: 'Unauthorized: No GitHub token' });
    return;
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Repository name required' });
    return;
  }

  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      res.status(response.status).json({ error: errorData.message || 'Failed to create repo' });
      return;
    }

    const repoData = await response.json();
    res.status(200).json({ success: true, repo: repoData });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
