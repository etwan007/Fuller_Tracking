import cookie from 'cookie';

export default async function githubFilesHandler(req, res) {
  try {
    // Parse cookies from the request header
    const cookies = cookie.parse(req.headers?.cookie || '');
    const githubToken = cookies.github_token;

    if (!githubToken) {
      return res.status(401).json({ error: 'Unauthorized: No GitHub token' });
    }

    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const response = await fetch('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${githubToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Failed to fetch repos', details: errorText });
    }

    const data = await response.json();
    return res.status(200).json({ files: data });
  } catch (error) {
    console.error('Error in githubFilesHandler:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}