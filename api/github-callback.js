// --- File: /api/github-callback.js ---
import fetch from 'node-fetch';
import { serialize } from 'cookie';

export async function githubCallbackHandler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('No code provided');
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const tokenRes = await fetch(`https://github.com/login/oauth/access_token`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    res.status(400).send('Failed to get access token');
    return;
  }

  res.setHeader('Set-Cookie', serialize('github_token', tokenData.access_token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }));

  res.writeHead(302, { Location: '/' });
  res.end();
}