import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed
import { linkPendingGithubCredential } from "./GithubLogin"; // adjust path as needed

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

export function GoogleLogin() {
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
       const user = result.user;
      // Get the Google access token for Calendar API
      // You can also get the Google-specific information used to authenticate
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential.idToken; // Google ID Token
    const accessToken = credential.accessToken; // Google Access Token
      linkPendingGithubCredential();
      
    console.log("User signed in successfully!", user);
    // Here you can update your UI to show the logged-in state

      // You can now use accessToken to call Google Calendar API
      console.log("Google Calendar Access Token:", accessToken);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };


  return (
    <button onClick={signInWithGoogle}>
      <img src="/img/Google-Logo.png" alt="Google Login" className="button login"/>
    </button>
  );
}