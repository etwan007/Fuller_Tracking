import { signInWithPopup, GithubAuthProvider, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo');

export function GitHubLogin() {
  async function signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      // The signed-in user info.
      const user = result.user;
        console.log("GitHub User Info:", user);
      // You can also get the GitHub-specific information used to authenticate
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken; // GitHub OAuth Access Token
      const idToken = credential.idToken; // GitHub OAuth ID Token (if available)

      console.log("User signed in successfully with GitHub!", user);
      console.log("GitHub Access Token:", accessToken);

      // Use the user object and accessToken as needed (e.g., call GitHub APIs)
      // Update your UI
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GithubAuthProvider.credentialFromError(error);

      if (errorCode === 'auth/account-exists-with-different-credential' && email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        const shouldLink = window.confirm(`An account already exists with the email ${email}.\nSign in using: ${methods[0]}.\nDo you want to link your GitHub account after signing in?`);
        if (shouldLink && credential) {
          // Store the credential for later linking
          localStorage.setItem('pendingGithubCredential', JSON.stringify(credential));
          localStorage.setItem('pendingGithubLink', 'true');
          alert(`Please sign in now using the ${methods[0]} button. After signing in, your GitHub account will be linked automatically.`);
        }
      } else {
        console.error("Error during GitHub Sign-in:", errorMessage);
      }
    }
  };

  return (
    <button
      onClick={signInWithGitHub}
      style={{ backgroundColor: "transparent", border: "none", padding: 0 }}
    >
      <img
        src="/img/github-logo.png"
        alt="Google Login"
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
