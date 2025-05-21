import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return res.status(400).json(tokenData);
  }

  // Save tokens in cookie for simplicity
  res.setHeader('Set-Cookie', [
    cookie.serialize('google_access_token', tokenData.access_token, {
      httpOnly: true,
      path: '/',
      maxAge: tokenData.expires_in,
    }),
    cookie.serialize('google_refresh_token', tokenData.refresh_token || '', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    }),
  ]);

  res.writeHead(302, { Location: '/' });
  res.end();
}
