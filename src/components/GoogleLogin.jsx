// components/GoogleLogin.jsx
import { Button } from './Button';

export function GoogleLogin({ onLogin }) {
  return (
    <Button onClick={onLogin}>
      Log in with Google
    </Button>
  );
}
