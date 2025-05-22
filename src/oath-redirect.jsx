import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    // Exchange the code for an access token
    fetch('/api/google-oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem('google_access_token', data.access_token);
          router.push('/'); // Redirect back to main app
        } else {
          alert('Failed to authenticate with Google');
        }
      });
  }, []);

  return <p>Authenticating with Google...</p>;
}
