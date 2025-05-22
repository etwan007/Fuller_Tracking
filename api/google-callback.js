// pages/api/google-callback.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { code } = req.query;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    
    // Option 2 (safer): Set HTTP-only cookie and redirect normally
    res.setHeader('Set-Cookie', `access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`);
    return res.redirect('/');
    
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.status(500).json({ error: 'OAuth failed' });
  }
}
