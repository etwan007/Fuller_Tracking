// components/GitHubRepoSync.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export default function GitHubRepoSync({ accessToken: propAccessToken, githubError }) {
  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let accessToken = propAccessToken; // Use a local variable to manage accessToken

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      console.log("Auth state changed:", u);
      setUser(u);
    });
    return () => unsubAuth();
  }, []);
  useEffect(() => {
    if (!user) {
      console.warn("User is not authenticated");
      return;
    }

    // Fallback to local storage if accessToken is not provided
    if (!accessToken) {
      const tokenFromStorage = localStorage.getItem("github_access_token");
      if (tokenFromStorage) {
        console.log("Using access token from local storage");
        accessToken = tokenFromStorage;
      } else {
        console.error("Access token is undefined and not found in local storage");
        return;
      }
    }

    // Sync repositories from GitHub to Firebase database
    const syncRepositories = async () => {
      try {
        setIsLoading(true);
        console.log("Syncing repositories from GitHub...");
        
        const response = await fetch("/api/github-sync", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            uid: user.uid
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("GitHub authentication failed during sync");
            return;
          }
          throw new Error(`GitHub sync failed: ${response.status} ${response.statusText}`);
        }        const syncResult = await response.json();
        console.log("GitHub sync completed:", syncResult);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to sync repositories:", err);
        setIsLoading(false);
      }
    };

    // Initial sync
    syncRepositories();

    // Set up periodic sync every 2 minutes
    const interval = setInterval(syncRepositories, 60000);

    return () => clearInterval(interval);
  }, [user, accessToken]);

  useEffect(() => {
    if (!user) {
      console.warn("No user for real-time listener"); // Debugging log
      return;
    }

    const q = query(collection(db, "repos"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repoList = snapshot.docs.map((doc) => doc.data());
      
      setRepos(repoList);
    });    return () => unsubscribe();
  }, [user]);
  
  return (
    <div className="container">
      <h2>GitHub Repositories</h2>
      
      {isLoading && <div>🔄 Syncing repositories...</div>}
      
      <ul className="repo-list">
        {repos.map((repo, idx) => (
          <li key={repo.id || idx} style={{ marginBottom: '0.5rem' }}>
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="button">
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
