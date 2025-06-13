import { serialize } from 'cookie';

export default async function githubCallbackHandler(req, res) {
  const { code, state, error, error_description, redirect } = req.query;

  // Handle OAuth errors (user denied access, etc.)
  if (error) {
    console.error('GitHub OAuth error:', error, error_description);
    const errorMessage = error_description || error;
    res.writeHead(302, { 
      Location: `/?github_error=${encodeURIComponent(errorMessage)}` 
    });
    res.end();
    return;
  }

  if (!code) {
    res.status(400).send('No authorization code provided');
    return;
  }

  // Basic state validation (in production, you should validate against stored state)
  if (!state) {
    console.warn('No state parameter provided - potential CSRF risk');
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GitHub OAuth credentials in environment variables');
    res.status(500).send('Server configuration error');
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: { 
        Accept: 'application/json', 
        'Content-Type': 'application/json',
        'User-Agent': 'Fuller-Tracking/1.0.0' // Best practice: include user agent
      },
      body: JSON.stringify({ 
        client_id: clientId, 
        client_secret: clientSecret, 
        code 
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status} ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token exchange response:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token');
    }

    // Verify the token works by making a test API call
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        'User-Agent': 'Fuller-Tracking/1.0.0'
      }
    });

    if (!userRes.ok) {
      throw new Error('Token validation failed - invalid access token received');
    }

    const userData = await userRes.json();
    console.log(`GitHub OAuth successful for user: ${userData.login}`);    // Set secure HTTP-only cookie with the access token
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.setHeader('Set-Cookie', serialize('github_token', tokenData.access_token, cookieOptions));

    // Redirect to the requested URL or default to home with token in URL for localStorage storage
    const redirectUrl = redirect && typeof redirect === 'string'
      ? decodeURIComponent(redirect)
      : `/?github_auth=success&github_access_token=${encodeURIComponent(tokenData.access_token)}`;
      
    res.writeHead(302, { Location: redirectUrl });
    res.end();

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    
    // Redirect with error message
    const errorMessage = encodeURIComponent(error.message || 'GitHub authentication failed');
    res.writeHead(302, { 
      Location: `/?github_error=${errorMessage}` 
    });
    res.end();
  }
}
