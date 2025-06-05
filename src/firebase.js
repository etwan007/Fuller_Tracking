import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBXS4aaWPgHCG9n0VuwukQLFdu2FbepyPw",
  authDomain: "fuller-tracking.vercel.app",
  projectId: "fuller-tracker",
  storageBucket: "fuller-tracker.firebasestorage.app",
  messagingSenderId: "275403964917",
  appId: "1:275403964917:web:5303fd11ce23f7fc8f60bc",
  measurementId: "G-XC05X7GTKL"
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { signInWithPopup, signOut };