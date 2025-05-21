import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  const { idToken } = req.body;

  try {
    // Verify JWT ID token from client
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // TODO: You can create user session here if needed

    // Exchange ID token for OAuth access token via OAuth2 flow
    // Since ID token does not provide access token directly, you might want to do
    // OAuth2 Authorization Code flow on backend with full scope access for Drive/Calendar/Sheets
    // Or send back the ID token for frontend to call Google APIs via Google Identity Services JS SDK

    // For simplicity, here we'll just respond with user info
    res.status(200).json({ message: 'ID Token verified', email: payload.email });
  } catch (err) {
    console.error('Google ID token verification failed:', err);
    res.status(401).json({ error: 'Invalid ID token' });
  }
}
