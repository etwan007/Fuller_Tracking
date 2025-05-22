import { Button } from './Button';

export function GoogleLogin() {
  const handleLogin = async () => {
    const res = await fetch('/api/google-login');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <Button onClick={handleLogin}>
      Log in with Google
    </Button>
  );
}