import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";

export async function firebaseSignInWithGoogleAccessToken(accessToken) {
  const credential = GoogleAuthProvider.credential(null, accessToken);
  await signInWithCredential(auth, credential);
}