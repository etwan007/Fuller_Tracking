import { useEffect } from 'react';

export function GoogleLogin({ onLogin }) {
  useEffect(() => {
    /* global google */
    if (!window.google) return; // wait for script load

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => {
        onLogin(response.credential); // JWT ID token
      },
    });

    google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large' }
    );
  }, []);

  return <div id="googleSignInDiv" className="my-4"></div>;
}
