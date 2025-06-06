import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed

const githubProvider = new GithubAuthProvider();

export function GitHubLogin() {
  async function signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      // The signed-in user info.
      const user = result.user;

      // You can also get the GitHub-specific information used to authenticate
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken; // GitHub OAuth Access Token
      const idToken = credential.idToken; // GitHub OAuth ID Token (if available)

      console.log("User signed in successfully with GitHub!", user);
      console.log("GitHub Access Token:", accessToken);

      // Use the user object and accessToken as needed (e.g., call GitHub APIs)
      // Update your UI
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData?.email;
      // The AuthCredential type that was used.
      const credential = GithubAuthProvider.credentialFromError(error);

      console.error("Error during GitHub Sign-in:", errorMessage);
      // Handle the error appropriately (e.g., display an error message)
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
