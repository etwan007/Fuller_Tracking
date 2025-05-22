import { google } from 'googleapis';

export default async function handler(req, res) {
  const { code } = req.body;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.status(200).json(tokens); // Contains access_token, refresh_token, expiry_date
  } catch (err) {
    console.error('OAuth token exchange error:', err);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
}
