import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBXS4aaWPgHCG9n0VuwukQLFdu2FbepyPw",
  authDomain: "fuller-tracker.firebaseapp.com",
  projectId: "fuller-tracker",
  storageBucket: "fuller-tracker.appspot.com",
  messagingSenderId: "275403964917",
  appId: "1:275403964917:web:5303fd11ce23f7fc8f60bc",
  measurementId: "G-XC05X7GTKL"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  } else {
    console.warn("Firebase Analytics is not supported in this environment.");
  }
});
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
export const db = getFirestore(app);

export { signInWithPopup, signOut, analytics };