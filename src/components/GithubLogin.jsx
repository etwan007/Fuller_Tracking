import { signInWithPopup, GithubAuthProvider, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo');

export function GitHubLogin({ onLoginSuccess }) {
  async function signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      console.log("GitHub Access Token:", accessToken);

      if (onLoginSuccess) {
        onLoginSuccess(accessToken, user);
      }
    } catch (error) {
      // (error handling stays the same)
    }
  }

  return (
    <button
      onClick={signInWithGitHub}
      style={{ backgroundColor: "transparent", border: "none", padding: 0 }}
    >
      <img
        src="/img/github-logo.png"
        alt="GitHub Login"
        className="button login"
      />
    </button>
  );
}


// Call this function after a successful sign-in with the existing provider (e.g., Google)
export async function linkPendingGithubCredential() {
  const shouldLink = localStorage.getItem('pendingGithubLink');
  const stored = localStorage.getItem('pendingGithubCredential');
  if (!shouldLink || !stored) return;
  try {
    const credentialObj = JSON.parse(stored);
    // Recreate the credential from the stored object
    const credential = GithubAuthProvider.credential(credentialObj.accessToken);
    const user = auth.currentUser;
    if (user && credential) {
      await linkWithCredential(user, credential);
      alert('Your GitHub account has been linked successfully!');
      console.log("GitHub User Info:", user);
      localStorage.removeItem('pendingGithubCredential');
      localStorage.removeItem('pendingGithubLink');
    }
  } catch (err) {
    console.error('Error linking GitHub credential:', err);
    alert('Failed to link your GitHub account. Please try again.');
    localStorage.removeItem('pendingGithubCredential');
    localStorage.removeItem('pendingGithubLink');
  }
}
