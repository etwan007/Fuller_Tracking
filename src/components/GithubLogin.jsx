import { signInWithPopup, GithubAuthProvider, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed

const githubProvider = new GithubAuthProvider();
// Enhanced OAuth scopes for better repository management
githubProvider.addScope('repo'); // Full repository access
githubProvider.addScope('user:email'); // Access to user email
githubProvider.addScope('read:user'); // Read user profile information

export function GitHubLogin({ onLoginSuccess }) {
  async function signInWithGitHub() {
    try {
      // Try Firebase popup login first
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      if (!accessToken) {
        throw new Error("Failed to retrieve GitHub access token");
      }

      console.log("GitHub Access Token:", accessToken);

      // Store access token in localStorage
      localStorage.setItem("github_access_token", accessToken);
      console.log("GitHub access token stored in localStorage");

      if (onLoginSuccess) {
        onLoginSuccess(accessToken, user); // Pass accessToken and user to parent
      }
    } catch (error) {
      console.error("GitHub login failed:", error);
      
      // If Firebase popup fails, fallback to OAuth flow
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log("Popup blocked, redirecting to OAuth flow...");
        try {
          const response = await fetch('/api/github-login');
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (oauthError) {
          console.error("OAuth redirect failed:", oauthError);
          alert("GitHub login failed. Please try again.");
        }
      } else {
        alert("GitHub login failed. Please try again.");
      }
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
